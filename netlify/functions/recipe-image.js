import { downloadImage } from '../lib/recipeImage.js';
const json = (statusCode, error) => ({ statusCode, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify({error}) });

// Download only. This function never opens the database or writes recipes.
export async function handler(event, context) {
  if (!context?.clientContext?.user?.email) return json(401, 'Sign in to import a photo URL.');
  if (event.httpMethod !== 'POST') return json(405, 'Use POST.');
  if ((event.body?.length || 0) > 8192) return json(400, 'The image URL is too long.');
  let url;
  try { ({url} = JSON.parse(event.body || '{}')); } catch { return json(400, 'Send an image URL.'); }
  if (typeof url !== 'string') return json(400, 'Send an image URL.');
  try {
    const image = await downloadImage(url);
    return { statusCode: 200, headers: { 'Content-Type': image.type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, isBase64Encoded: true, body: image.bytes.toString('base64') };
  } catch {
    return json(400, 'Could not fetch that photo. Use a public HTTPS image URL, or download it and upload the file (remote limit: 4 MB).');
  }
}
