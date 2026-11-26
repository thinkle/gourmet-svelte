import { getOne } from '../../src/data/functions/mongoConnect.js';
import { getUserFromApiToken, touchApiToken } from '../../src/data/functions/tokenFunctions.js';
import { shoppingCommand, shoppingError } from './shoppingListApi.js';

const response = (statusCode, body) => ({ statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }, body: JSON.stringify(body) });
export function shoppingPath(event) {
  const path = event.path || event.rawPath || '';
  const match = /^(?:\/\.netlify\/functions\/api|\/api)?\/shopping-list(?:\/(.*))?\/?$/.exec(path);
  return match ? (match[1] || '').replace(/\/$/, '') : null;
}
async function authenticate(event, context, scope) {
  const identity = context?.clientContext?.user;
  if (identity?.email) {
    const dbUser = await getOne('users', { email: identity.email });
    if (!dbUser) throw shoppingError(403, 'Open your recipe library before using shopping commands.');
    return dbUser.linked || identity.email;
  }
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  const auth = headers.authorization || '';
  let token = headers['x-api-key'] || (/^Bearer\s+/i.test(auth) ? auth.replace(/^Bearer\s+/i, '') : '');
  if (!token && /^Basic\s+/i.test(auth)) {
    const decoded = Buffer.from(auth.replace(/^Basic\s+/i, ''), 'base64').toString('utf8');
    token = decoded.includes(':') ? decoded.slice(decoded.indexOf(':') + 1) : decoded;
  }
  const found = await getUserFromApiToken(typeof token === 'string' ? token.trim() : null);
  if (!found) throw shoppingError(401, 'Unauthorized');
  if (!found.user.scopes.includes(scope)) throw shoppingError(403, 'Insufficient scope');
  await touchApiToken(found.user.apiTokenId);
  return found.user.account;
}

export async function shoppingRouter(event, context, path) {
  try {
    const method = (event.httpMethod || 'GET').toUpperCase();
    const read = path === '' && method === 'GET';
    const account = await authenticate(event, context, read ? 'recipes:read' : 'recipes:write');
    if (!read && (method !== 'POST' || !['items/add', 'recipes/add', 'items/remove', 'recipes/remove', 'items/categorize'].includes(path))) {
      throw shoppingError(405, 'Method not allowed');
    }
    let input;
    if (read) input = event.queryStringParameters || {};
    else {
      try { input = JSON.parse(event.body); }
      catch { throw shoppingError(400, 'Invalid JSON.'); }
    }
    return response(200, await shoppingCommand(account, read ? 'read' : path, input));
  } catch (err) {
    return response(err.statusCode || 500, { error: err.statusCode ? err.message : 'Shopping list is temporarily unavailable.' });
  }
}
