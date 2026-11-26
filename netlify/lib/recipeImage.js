// A bounded photo download. DNS is checked and pinned on every redirect;
// no cookies, API credentials, or other caller headers go to the image host.
import { promises as dns } from 'dns';
const dnsLookup = dns.lookup;
import { request as httpsRequest } from 'https';
import { BlockList, isIP } from 'net';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const blocked = new BlockList();
for (const [ip, bits] of [['0.0.0.0',8], ['10.0.0.0',8], ['100.64.0.0',10], ['127.0.0.0',8],
  ['169.254.0.0',16], ['172.16.0.0',12], ['192.0.0.0',24], ['192.0.2.0',24], ['192.88.99.0',24],
  ['192.168.0.0',16], ['198.18.0.0',15], ['198.51.100.0',24], ['203.0.113.0',24], ['224.0.0.0',4], ['240.0.0.0',4]]) blocked.addSubnet(ip,bits,'ipv4');
const globalV6 = new BlockList();
globalV6.addSubnet('2000::',3,'ipv6');
for (const [ip,bits] of [['2001::',23], ['2001:db8::',32], ['2002::',16], ['3fff::',20]]) blocked.addSubnet(ip,bits,'ipv6');

export const publicAddress = (address) => {
  const family = isIP(address);
  return family === 4 ? !blocked.check(address,'ipv4') : family === 6 && globalV6.check(address,'ipv6') && !blocked.check(address,'ipv6');
};
export function imageUrl(value) {
  let url;
  try { url = new URL(value); } catch { throw new Error('Paste a full HTTPS image URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new Error('Use a public HTTPS image URL on the standard port.');
  return url;
}

export async function downloadImage(value, { lookup = dnsLookup, request = httpsRequest, redirects = 0 } = {}) {
  const url = imageUrl(value);
  const hostname = url.hostname.replace(/^\[|\]$/g, '');
  const addresses = isIP(hostname) ? [{ address: hostname, family: isIP(hostname) }] : await Promise.race([
    lookup(hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => { const timer = setTimeout(() => reject(new Error('Image host lookup timed out.')), 5000); timer.unref?.(); }),
  ]);
  if (!addresses.length || !addresses.every(({address}) => publicAddress(address))) throw new Error('Use an image hosted at a public Internet address.');
  const pinned = addresses[0];
  const result = await new Promise((resolve, reject) => {
    const req = request(url, {
      agent: false,
      headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif', 'User-Agent': 'Gourmet-Photo-Import/1.0' },
      lookup: (_host, options, done) => options?.all
        ? done(null, [pinned]) : done(null, pinned.address, pinned.family),
    }, (res) => {
      if ([301,302,303,307,308].includes(res.statusCode)) {
        res.destroy();
        resolve({ redirect: res.headers.location });
        return;
      }
      const type = String(res.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
      if (res.statusCode !== 200 || !TYPES.has(type)) {
        res.destroy(); reject(new Error('That URL did not return a supported photo. Try uploading the image file.')); return;
      }
      if (Number(res.headers['content-length']) > MAX_IMAGE_BYTES) {
        res.destroy(); reject(new Error('The remote photo is too large. Download it and use Upload photos.')); return;
      }
      const chunks = []; let bytes = 0;
      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_IMAGE_BYTES) { res.destroy(); reject(new Error('The remote photo is too large. Download it and use Upload photos.')); }
        else chunks.push(chunk);
      });
      res.on('end', () => resolve({ bytes: Buffer.concat(chunks), type }));
      res.on('error', reject);
      res.on('aborted', () => reject(new Error('The photo download was interrupted.')));
    });
    const deadline = setTimeout(() => req.destroy(new Error('Photo download timed out.')), 8000);
    deadline.unref?.();
    req.on('close', () => clearTimeout(deadline));
    req.on('error', reject);
    req.end();
  });
  if ('redirect' in result) {
    if (!result.redirect || redirects >= 3) throw new Error('The photo URL redirected too many times.');
    return downloadImage(new URL(result.redirect, url).href, { lookup, request, redirects: redirects + 1 });
  }
  return result;
}
