import { startApi } from '../../src/data/functions/testing/apiHarness.js';
import { loadDB } from '../../src/data/functions/mongoConnect.js';
import { handler } from '../functions/live-shopping.js';

let api;
let db;
const alice = 'live-alice@example.test';
const bob = 'live-bob@example.test';
const base = { _id: 'live-list', owner: { email: alice }, isShoppingList: 1, deleted: 0,
  ingredients: [{ id: 1, text: 'milk' }, { id: 2, text: 'eggs' }], cart: [], trip: ['oil'],
  images: ['private-image'], aisles: { milk: 'Dairy' } };
async function call(body = { listId: 'live-list' }, email = alice, method = 'POST') {
  const res = await handler({ httpMethod: method, body: JSON.stringify(body),
    headers: { localuser: JSON.stringify({ email: alice }), referer: 'http://localhost' } },
  email ? { clientContext: { user: { email } } } : {});
  return { status: res.statusCode, ...JSON.parse(res.body), headers: res.headers };
}
const action = (tripId, clientId, seq, key, on = true) => ({ tripId, clientId, seq, type: 'cart', key, on });
const send = (a) => call({ listId: base._id, action: a });
beforeAll(async () => { api = await startApi(); ({ db } = await loadDB()); });
afterAll(async () => { if (api) await api.stop(); });
beforeEach(async () => {
  await api.reset();
  await db.collection('users').deleteMany({ email: { $in: [alice, bob] } });
  await db.collection('users').insertMany([{ email: alice }, { email: bob }]);
  await db.collection('recipes').insertOne(JSON.parse(JSON.stringify(base)));
});

it('requires validated Identity context; headers cannot impersonate a shopper', async () => {
  expect((await call(undefined, null)).status).toBe(401);
});
it('enforces account ownership and only accepts shopping lists', async () => {
  expect((await call(undefined, bob)).status).toBe(404);
  await db.collection('recipes').updateOne({ _id: base._id }, { $set: { isShoppingList: 0 } });
  expect((await call()).status).toBe(404);
});
it('supports the existing linked account without trusting a supplied account', async () => {
  await db.collection('users').updateOne({ email: bob }, { $set: { linked: alice } });
  expect((await call({ listId: base._id }, bob)).status).toBe(200);
  expect((await call({ listId: base._id, account: alice }, 'stranger@example.test')).status).toBe(403);
});
it('initializes one trip for concurrent joiners, hides images and prevents caching', async () => {
  const joins = await Promise.all([call(), call(), call()]);
  expect(new Set(joins.map((r) => r.recipe.liveShopping.tripId)).size).toBe(1);
  expect(joins[0].recipe.images).toBeUndefined();
  expect(joins[0].headers['Cache-Control']).toBe('no-store');
  expect((await db.collection('recipes').findOne({ _id: base._id })).images).toEqual(base.images);
});
it('keeps both shoppers’ simultaneous checks and leaves other recipe fields untouched', async () => {
  const { recipe } = await call();
  const trip = recipe.liveShopping.tripId;
  await Promise.all([send(action(trip, 'phone-a', 1, 'milk')), send(action(trip, 'phone-b', 1, 'eggs'))]);
  const stored = await db.collection('recipes').findOne({ _id: base._id });
  expect(stored.cart.sort()).toEqual(['eggs', 'milk']);
  expect(stored.ingredients).toEqual(base.ingredients);
  expect(stored.aisles).toEqual(base.aisles);
  expect(stored.liveShopping.revision).toBe(2);
});
it('deduplicates retries and ignores older actions from the same phone', async () => {
  const trip = (await call()).recipe.liveShopping.tripId;
  await send(action(trip, 'phone-a', 1, 'milk'));
  await send(action(trip, 'phone-a', 2, 'milk', false));
  await send(action(trip, 'phone-a', 1, 'milk'));
  await send(action(trip, 'phone-a', 2, 'milk', false));
  const { recipe } = await call();
  expect(recipe.cart).toEqual([]);
  expect(recipe.liveShopping.revision).toBe(2);
});
it('uses server arrival order for contradictory actions from different phones', async () => {
  const trip = (await call()).recipe.liveShopping.tripId;
  await send(action(trip, 'phone-a', 1, 'milk'));
  await send(action(trip, 'phone-b', 1, 'milk', false));
  expect((await call()).recipe.cart).toEqual([]);
});
it('ends a trip atomically; delayed offline checks and a retried Done cannot change the next trip', async () => {
  const trip = (await call()).recipe.liveShopping.tripId;
  const done = { type: 'done', tripId: trip, clientId: 'phone-a', seq: 2 };
  await send(action(trip, 'phone-a', 1, 'milk'));
  const ended = await send(done);
  expect(ended.recipe.cart).toEqual([]);
  expect(ended.recipe.trip).toEqual([]);
  const next = ended.recipe.liveShopping.tripId;
  expect(next).not.toBe(trip);
  await send(action(next, 'phone-a', 3, 'eggs'));
  expect((await send(action(trip, 'phone-b', 1, 'milk'))).staleTrip).toBe(true);
  expect((await send(done)).recipe.cart).toEqual(['eggs']);
});
it.each([
  { listId: { $ne: null } },
  { listId: base._id, action: { type: 'cart' } },
  { listId: base._id, action: action('trip', 'bad.client', 1, 'milk') },
  { listId: base._id, action: action('trip', 'client', -1, 'milk') },
  { listId: base._id, action: action('trip', 'client', 1, '$milk', 'yes') },
])('rejects malformed inputs without a write: %j', async (input) => {
  expect((await call(input)).status).toBe(400);
  expect((await db.collection('recipes').findOne({ _id: base._id })).liveShopping).toBeUndefined();
});
it('rejects unsupported methods and invalid JSON', async () => {
  expect((await call(undefined, alice, 'GET')).status).toBe(405);
  const res = await handler({ httpMethod: 'POST', body: '{' }, { clientContext: { user: { email: alice } } });
  expect(res.statusCode).toBe(400);
});
