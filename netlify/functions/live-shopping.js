import { getOne } from '../../src/data/functions/mongoConnect.js';
import { liveShopping } from '../lib/liveShopping.js';

const response = (statusCode, body) => ({ statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body) });

// Private UI endpoint: Netlify validates the Identity JWT before populating clientContext.
// No client-supplied account, localuser header or API-token fallback is accepted here.
export async function handler(event, context) {
  const identity = context?.clientContext?.user;
  if (!identity?.email) return response(401, { error: 'Sign in to use live shopping.' });
  if (event.httpMethod !== 'POST') return response(405, { error: 'Method not allowed.' });
  let input;
  try { input = JSON.parse(event.body); }
  catch { return response(400, { error: 'Invalid JSON.' }); }
  try {
    const user = await getOne('users', { email: identity.email });
    if (!user) return response(403, { error: 'Open your recipe library before using live shopping.' });
    return response(200, await liveShopping(user.linked || identity.email, input));
  } catch (err) {
    // Never echo database errors, credentials, headers or request bodies.
    return response(err.status || 500, { error: err.status ? err.message : 'Live shopping is temporarily unavailable.' });
  }
}
