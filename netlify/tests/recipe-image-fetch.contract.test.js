import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import { publicAddress, downloadImage } from '../lib/recipeImage.js';
import { handler } from '../functions/recipe-image.js';

const lookup = jest.fn(async () => [{ address: '93.184.216.34', family: 4 }]);
function transport(replies) {
  return jest.fn((url, options, receive) => {
    const req = new EventEmitter();
    req.end = () => {
      const next = replies.shift();
      const res = new PassThrough();
      res.statusCode = next.status || 200;
      res.headers = next.headers || { 'content-type': 'image/png' };
      receive(res);
      res.end(next.bytes || Buffer.from('synthetic-photo'));
      req.emit('close');
    };
    req.destroy = (err) => { req.emit('error', err); req.emit('close'); };
    return req;
  });
}
beforeEach(() => lookup.mockClear());
it.each(['127.0.0.1','10.1.2.3','192.168.1.1','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','::ffff:127.0.0.1','fc00::1','fe80::1','2001:db8::1','2002:7f00:1::'])('rejects nonpublic address %s', ip => expect(publicAddress(ip)).toBe(false));
it('allows public IPv4/IPv6 and pins the checked DNS answer', async () => {
  expect(publicAddress('93.184.216.34')).toBe(true);
  expect(publicAddress('2606:4700:4700::1111')).toBe(true);
  const request = transport([{}]);
  const result = await downloadImage('https://images.example/photo.png', { lookup, request });
  expect(result.type).toBe('image/png');
  expect(result.bytes.toString()).toBe('synthetic-photo');
  const options = request.mock.calls[0][1];
  const done = jest.fn(); options.lookup('images.example', {}, done);
  expect(done).toHaveBeenCalledWith(null, '93.184.216.34', 4);
  expect(options.headers.Authorization).toBeUndefined();
});
it('rechecks redirects and rejects a private redirect without connecting', async () => {
  const request = transport([{ status: 302, headers: {location: 'https://127.0.0.1/private'} }]);
  await expect(downloadImage('https://images.example/photo', { lookup, request })).rejects.toThrow(/public/);
  expect(request).toHaveBeenCalledTimes(1);
});
it('rejects mixed public/private DNS answers', async () => {
  const request = transport([]);
  await expect(downloadImage('https://images.example/photo', { lookup: async () => [{address:'93.184.216.34',family:4},{address:'10.0.0.1',family:4}], request })).rejects.toThrow(/public/);
  expect(request).not.toHaveBeenCalled();
});
it.each(['http://images.example/photo','file:///tmp/photo','https://user:pass@images.example/photo','https://images.example:8080/photo'])('rejects unsupported URL %s before DNS', async value => {
  await expect(downloadImage(value,{lookup})).rejects.toThrow();
  expect(lookup).not.toHaveBeenCalled();
});
it.each([
  { headers: {'content-type':'text/html'} },
  { headers: {'content-type':'image/svg+xml'} },
  { headers: {'content-type':'image/png','content-length':'5000000'} },
  { bytes: Buffer.alloc(4200000) },
])('rejects invalid or oversized remote photos', async reply => {
  await expect(downloadImage('https://images.example/photo',{lookup,request:transport([reply])})).rejects.toThrow();
});
it('requires sign-in and valid POST input before any network access', async () => {
  expect((await handler({httpMethod:'POST',body:'{}'},{})).statusCode).toBe(401);
  const context = {clientContext:{user:{email:'photo-test@example.invalid'}}};
  expect((await handler({httpMethod:'GET'},context)).statusCode).toBe(405);
  expect((await handler({httpMethod:'POST',body:'not-json'},context)).statusCode).toBe(400);
  expect((await handler({httpMethod:'POST',body:'{}'},context)).statusCode).toBe(400);
});
