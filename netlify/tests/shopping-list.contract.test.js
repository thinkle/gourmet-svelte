import { startApi } from '../../src/data/functions/testing/apiHarness.js';
import { loadDB } from '../../src/data/functions/mongoConnect.js';
import { handler } from '../functions/api.js';

let api, db, alice, bob, readOnly;
const ALICE = 'shop-alice@example.test';
const BOB = 'shop-bob@example.test';
const list = { _id: 'list-a', title: 'Shopping List', isShoppingList: 1, deleted: 0,
  owner: { email: ALICE }, ingredients: [], images: ['keep-image'], cart: ['milk'],
  alreadyHave: ['salt'], trip: ['oil'], liveShopping: { tripId: 'trip', revision: 3, seen: { phone: 4 } } };
const recipe = { _id: 'recipe-a', id: 8, title: 'Soup', owner: { email: ALICE }, deleted: 0,
  ingredients: [{ id: 1, text: 'onions', amount: { amount: 2, unit: 'lb' } },
    { id: 2, text: 'salt', amount: { amount: 1, unit: 'tsp' } }] };
async function call(method = 'GET', suffix = '', body, token = alice?.token, query) {
  const res = await handler({ httpMethod: method, path: `/.netlify/functions/api/shopping-list${suffix}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    queryStringParameters: query || null, body: body === undefined ? null : JSON.stringify(body) }, {});
  return { status: res.statusCode, json: JSON.parse(res.body), headers: res.headers };
}
const command = (suffix, body, token) => call('POST', `/${suffix}`, body, token);
const stored = () => db.collection('recipes').findOne({ _id: list._id });
beforeAll(async () => { api = await startApi(); ({ db } = await loadDB()); });
afterAll(async () => { if (api) await api.stop(); });
beforeEach(async () => {
  await api.reset();
  alice = await api.makeToken(ALICE); bob = await api.makeToken(BOB);
  readOnly = await api.makeToken(ALICE, ['recipes:read']);
  await db.collection('recipes').insertMany([JSON.parse(JSON.stringify(list)), JSON.parse(JSON.stringify(recipe))]);
});

describe('shopping authentication and routing', () => {
  it.each(['items/add', 'recipes/add', 'items/remove', 'recipes/remove', 'items/categorize'])('%s requires authentication and write scope', async (path) => {
    expect((await command(path, {}, null)).status).toBe(401);
    expect((await command(path, {}, readOnly.token)).status).toBe(403);
  });
  it('supports read-only access, requires auth and marks all responses no-store', async () => {
    expect((await call('GET', '', undefined, null)).status).toBe(401);
    const res = await call('GET', '', undefined, readOnly.token);
    expect(res.status).toBe(200);
    expect(res.headers['Cache-Control']).toBe('no-store');
  });
  it('rejects revoked tokens without changing the list', async () => {
    await api.revoke(ALICE, alice.id);
    const before = await stored();
    expect((await command('items/add', { text: 'apples' })).status).toBe(401);
    expect(await stored()).toEqual(before);
  });
  it('accepts X-Api-Key and Basic auth without trusting localuser headers', async () => {
    for (const headers of [
      { 'X-Api-Key': alice.token },
      { authorization: `Basic ${Buffer.from(`user:${alice.token}`).toString('base64')}` },
    ]) {
      const res = await handler({ httpMethod: 'GET', path: '/api/shopping-list', headers }, {});
      expect(res.statusCode).toBe(200);
    }
    const fake = await handler({ httpMethod: 'GET', path: '/api/shopping-list',
      headers: { localuser: JSON.stringify({ email: ALICE }), referer: 'http://localhost' } }, {});
    expect(fake.statusCode).toBe(401);
  });
  it('rejects cross-account lists and recipe references', async () => {
    expect((await call('GET', '', undefined, bob.token, { listId: list._id })).status).toBe(404);
    expect((await command('recipes/add', { recipeId: recipe._id }, bob.token)).status).toBe(404);
    expect(await db.collection('recipes').countDocuments({ 'owner.email': BOB })).toBe(0);
  });
  it('resolves existing linked accounts for Identity sessions and ignores supplied owner', async () => {
    await db.collection('users').updateOne({ email: BOB }, { $set: { linked: ALICE } }, { upsert: true });
    const res = await handler({ httpMethod: 'GET', path: '/api/shopping-list', queryStringParameters: { account: ALICE } },
      { clientContext: { user: { email: BOB } } });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).listId).toBe(list._id);
    expect((await call('GET', '', undefined, bob.token, { account: ALICE })).json.listId).toBeNull();
  });
  it('delegates existing recipe routes and modes without changing update semantics', async () => {
    const res = await handler({ httpMethod: 'PUT', path: `/.netlify/functions/api/recipes/${recipe._id}`,
      headers: { Authorization: `Bearer ${alice.token}` }, body: JSON.stringify({ ingredients: ['1 carrot'] }) }, {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).ingredients).toHaveLength(1);
    const read = await handler({ httpMethod: 'GET', path: '/.netlify/functions/api/recipes/schema',
      headers: { Authorization: `Bearer ${alice.token}` } }, {});
    expect(read.statusCode).toBe(200);
  });
  it('rejects malformed JSON and unsupported commands/methods', async () => {
    expect((await call('DELETE')).status).toBe(405);
    expect((await command('erase-everything', {})).status).toBe(405);
    const res = await handler({ httpMethod: 'POST', path: '/.netlify/functions/api/shopping-list/items/add',
      headers: { Authorization: `Bearer ${alice.token}` }, body: '{' }, {});
    expect(res.statusCode).toBe(400);
  });
});

describe('read and discovery', () => {
  it('reads an empty list without exposing images or internal live metadata', async () => {
    const res = await call();
    expect(res.status).toBe(200);
    expect(res.json).toMatchObject({ listId: list._id, recipes: [], items: [] });
    expect(res.json.categories).toContain('Produce');
    expect(res.json.images).toBeUndefined(); expect(res.json.liveShopping).toBeUndefined();
  });
  it('matches the app default selection and permits an explicit list', async () => {
    await db.collection('recipes').insertOne({ ...JSON.parse(JSON.stringify(list)), _id: 'list-b',
      ingredients: [{ id: 1, text: 'apples' }], last_modified: 1 });
    expect((await call()).json.listId).toBe('list-b');
    expect((await call('GET', '', undefined, alice.token, { listId: list._id })).json.listId).toBe(list._id);
  });
  it('does not create a list for reads; simultaneous first adds create just one list', async () => {
    await db.collection('recipes').deleteOne({ _id: list._id });
    expect((await call()).json.listId).toBeNull();
    expect(await db.collection('recipes').countDocuments({ isShoppingList: 1 })).toBe(0);
    const results = await Promise.all(['onions', 'apples', 'eggs'].map((s) => command('items/add', { text: s })));
    expect(results.map((r) => r.status)).toEqual([200, 200, 200]);
    expect(await db.collection('recipes').countDocuments({ isShoppingList: 1 })).toBe(1);
    expect((await call()).json.items).toHaveLength(3);
  });
});

describe('shopping commands', () => {
  it('parses a loose item, identifies its canonical key and suggested category, and preserves other state', async () => {
    const before = await stored();
    const res = await command('items/add', { text: '2 lb onions; finely chopped' });
    expect(res.status).toBe(200);
    expect(res.json.items[0]).toMatchObject({ key: 'onions', category: 'Produce', categorySource: 'suggested' });
    expect(res.json.items[0].sources[0].text).toContain('finely chopped');
    const after = await stored();
    expect(after.ingredients[0]).toMatchObject({ amount: { amount: 2, unit: 'lb' }, id: 1 });
    for (const field of ['images', 'cart', 'alreadyHave', 'trip', 'liveShopping']) expect(after[field]).toEqual(before[field]);
    expect(after.last_remote_save).toBeInstanceOf(Date);
    expect(after.last_modified).toEqual(expect.any(Number));
  });
  it('adds recipes by reference at a multiplier, sums repeated adds and leaves the recipe untouched', async () => {
    const before = await db.collection('recipes').findOne({ _id: recipe._id });
    await command('recipes/add', { recipeId: recipe._id, multiplier: 2 });
    const res = await command('recipes/add', { recipeId: recipe._id, multiplier: 0.5 });
    expect(res.status).toBe(200);
    expect(res.json.recipes).toEqual([{ recipeId: recipe._id, title: 'Soup', multiplier: 2.5, found: true }]);
    expect(res.json.items.find((i) => i.key === 'onions').amounts[0].amount).toBe(5);
    expect(res.json.items.find((i) => i.key === 'salt').state).toBe('have');
    expect((await stored()).ingredients).toHaveLength(1);
    expect(await db.collection('recipes').findOne({ _id: recipe._id })).toEqual(before);
  });
  it('removes a recipe reference without removing loose items or deleting the source recipe', async () => {
    await command('recipes/add', { recipeId: recipe._id });
    await command('items/add', { text: 'milk' });
    const res = await command('recipes/remove', { recipeId: recipe._id });
    expect(res.status).toBe(200); expect(res.json.recipes).toEqual([]);
    expect(res.json.items.map((i) => i.key)).toEqual(['milk']);
    expect(await db.collection('recipes').findOne({ _id: recipe._id })).not.toBeNull();
  });
  it('removes a merged item from loose and recipe contributions without editing the recipe', async () => {
    await command('recipes/add', { recipeId: recipe._id });
    await command('items/add', { text: '1 lb onions' });
    const res = await command('items/remove', { key: 'onions' });
    expect(res.status).toBe(200);
    expect(res.json.items.some((i) => i.key === 'onions')).toBe(false);
    expect(res.json.excludedItems).toEqual(['onions']);
    expect((await stored()).ingredients).toHaveLength(1);
    expect((await db.collection('recipes').findOne({ _id: recipe._id })).ingredients).toEqual(recipe.ingredients);
    const again = await command('items/add', { text: 'onions' });
    expect(again.json.excludedItems).toEqual([]);
    expect(again.json.items.some((i) => i.key === 'onions')).toBe(true);
  });
  it('categorizes multiple items atomically and null restores automatic categories', async () => {
    await command('items/add', { text: 'onions' }); await command('items/add', { text: 'milk' });
    const res = await command('items/categorize', { keys: ['onions', 'milk', 'onions'], category: '$Custom aisle' });
    expect(res.status).toBe(200);
    expect(res.json.items.every((i) => i.category === '$Custom aisle' && i.categorySource === 'assigned')).toBe(true);
    expect(res.json.categories).toContain('$Custom aisle');
    const cleared = await command('items/categorize', { keys: ['onions'], category: null });
    expect(cleared.json.items.find((i) => i.key === 'onions')).toMatchObject({ category: 'Produce', categorySource: 'suggested' });
    expect(cleared.json.items.find((i) => i.key === 'milk').category).toBe('$Custom aisle');
  });
  it('uses renamed canonical keys and refuses partial categorization when a key is missing', async () => {
    await command('items/add', { text: 'onions' });
    await db.collection('recipes').updateOne({ _id: list._id }, { $set: { keyAliases: { onions: 'alliums' } } });
    const before = await stored();
    expect((await command('items/categorize', { keys: ['alliums', 'missing'], category: 'Produce' })).status).toBe(404);
    expect(await stored()).toEqual(before);
    expect((await command('items/categorize', { keys: ['alliums'], category: 'My aisle' })).status).toBe(200);
    expect((await command('items/remove', { key: 'alliums' })).json.items).toEqual([]);
  });
  it('retains concurrent additions with unique entry ids and summed recipe multipliers', async () => {
    const results = await Promise.all([
      command('items/add', { text: 'apples' }), command('items/add', { text: 'milk' }),
      command('recipes/add', { recipeId: recipe._id }), command('recipes/add', { recipeId: recipe._id, multiplier: 2 }),
    ]);
    expect(results.map((r) => r.status)).toEqual([200, 200, 200, 200]);
    const saved = await stored();
    expect(saved.ingredients).toHaveLength(3);
    expect(new Set(saved.ingredients.map((i) => i.id)).size).toBe(3);
    expect(saved.ingredients.find((i) => i.reference).amount.amount).toBe(3);
    expect(saved.cart).toEqual(list.cart);
  });
  it('preserves a concurrent cart change while adding a loose item', async () => {
    const [res] = await Promise.all([
      command('items/add', { text: 'apples' }),
      db.collection('recipes').updateOne({ _id: list._id }, { $addToSet: { cart: 'eggs' }, $inc: { 'liveShopping.revision': 1 } }),
    ]);
    expect(res.status).toBe(200);
    const saved = await stored();
    expect(saved.cart.sort()).toEqual(['eggs', 'milk']);
    expect(saved.liveShopping.revision).toBe(4);
    expect(saved.ingredients[0].text).toBe('apples');
  });
  it('follows nested references even when server documents share a device-local id', async () => {
    await db.collection('recipes').insertOne({ ...recipe, _id: 'nested-recipe', id: recipe.id, title: 'Nested',
      ingredients: [{ text: 'apples', amount: { amount: 2, unit: '' } }] });
    await db.collection('recipes').updateOne({ _id: recipe._id }, { $push: { ingredients: {
      text: 'Nested', reference: 'nested-recipe', referenceExists: true, amount: { amount: 3, unit: 'recipe' },
    } } });
    const res = await command('recipes/add', { recipeId: recipe._id, multiplier: 2 });
    expect(res.status).toBe(200);
    const apples = res.json.items.find((i) => i.key === 'apples');
    expect(apples.amounts[0].amount).toBe(12);
    expect(apples.sources[0].recipeId).toBe(recipe._id);
  });
  it.each([
    ['items/add', { text: '' }], ['items/add', { text: { $ne: '' } }],
    ['recipes/add', { recipeId: recipe._id, multiplier: 0 }],
    ['recipes/add', { recipeId: recipe._id, multiplier: '2' }],
    ['recipes/add', { recipeId: recipe._id, multiplier: 10001 }],
    ['items/remove', { key: { $gt: '' } }], ['items/categorize', { keys: [], category: 'Produce' }],
    ['items/categorize', { keys: ['onions'], category: { $set: 1 } }],
    ['items/add', { text: 'onions', listId: { $ne: '' } }],
  ])('rejects invalid %s input without changing the list', async (path, body) => {
    const before = await stored();
    expect((await command(path, body)).status).toBe(400);
    expect(await stored()).toEqual(before);
  });
  it('does not accept deleted lists, deleted recipes or shopping lists as source recipes', async () => {
    expect((await command('recipes/add', { recipeId: list._id })).status).toBe(404);
    await db.collection('recipes').updateOne({ _id: recipe._id }, { $set: { deleted: 1 } });
    expect((await command('recipes/add', { recipeId: recipe._id })).status).toBe(404);
    await db.collection('recipes').updateOne({ _id: list._id }, { $set: { deleted: 1 } });
    expect((await command('items/add', { listId: list._id, text: 'milk' })).status).toBe(404);
  });
});
