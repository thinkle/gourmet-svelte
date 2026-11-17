/**
   REST API contract tests (card P0-5).

   Drives handler() from api.js with Netlify-style events against an in-memory
   MongoDB. Where the code and public/openapi.yaml disagree these tests pin
   what the code does and say so in a comment ("DISAGREES WITH YAML").
   Known bugs are left in as skipped tests ("BUG").
**/
import { startApi, assertLocalMongoUrl } from './testing/apiHarness.js';

const ALICE = 'alice@example.test';
const BOB = 'bob@example.test';
const IMG = 'data:image/png;base64,SECRETIMAGEBYTES';

let api;
let alice; // { token, id }
let bob;
let readOnly; // alice's account, recipes:read only

beforeAll(async () => {
    api = await startApi();
});
afterAll(async () => {
    if (api) { await api.stop(); }
});
beforeEach(async () => {
    await api.reset();
    alice = await api.makeToken(ALICE);
    bob = await api.makeToken(BOB);
    readOnly = await api.makeToken(ALICE, ['recipes:read']);
});

const as = (who) => ({ token: who.token });
async function create(body, who = alice) {
    const res = await api.call('POST', '/recipes', { ...as(who), body });
    expect(res.status).toBe(200);
    return res.json;
}
const ingText = (r) => r.ingredients.map((i) => i.text);

describe('test safety guard', () => {
    it('refuses any MONGO_URL that is not 127.0.0.1 or localhost', () => {
        expect(() => assertLocalMongoUrl('mongodb+srv://u:p@cluster0.example.net/db')).toThrow(/Refusing/);
        expect(() => assertLocalMongoUrl('mongodb://u:p@db.example.net:27017/db')).toThrow(/Refusing/);
        expect(() => assertLocalMongoUrl('mongodb://127.0.0.1:27017,db.example.net/x')).toThrow(/Refusing/);
        expect(() => assertLocalMongoUrl('mongodb://127.0.0.1:27017/x')).not.toThrow();
        expect(() => assertLocalMongoUrl('mongodb://localhost:27017/x')).not.toThrow();
    });
    it('is talking to the in-memory server', () => {
        expect(process.env.MONGO_URL).toMatch(/^mongodb:\/\/127\.0\.0\.1:\d+/);
    });
});

describe('auth', () => {
    const readRoutes = [
        ['GET', '/recipes'],
        ['GET', '/recipes/schema'],
        ['GET', '/recipes/summary'],
        ['GET', '/recipes/someid'],
        ['POST', '/recipes/query'],
        ['POST', '/recipes/summary/query'],
        ['POST', '/recipes/get'],
    ];
    const writeRoutes = [
        ['POST', '/recipes'],
        ['POST', '/recipes/update'],
        ['POST', '/recipes/delete'],
        ['POST', '/recipes/reparse-ingredients'],
        ['PATCH', '/recipes/someid'],
        ['PUT', '/recipes/someid'],
        ['DELETE', '/recipes/someid'],
    ];

    it.each([...readRoutes, ...writeRoutes])('%s %s without a token is 401 with an error string', async (method, path) => {
        const res = await api.call(method, path, { body: { id: 'x', title: 't' } });
        expect(res.status).toBe(401);
        expect(typeof res.json.error).toBe('string');
        expect(Object.keys(res.json)).toEqual(['error']);
    });

    it('an unknown token is 401', async () => {
        const res = await api.call('GET', '/recipes', { token: 'not-a-real-token' });
        expect(res.status).toBe(401);
    });

    it('a revoked token is 401, and works until revoked', async () => {
        const t = await api.makeToken(ALICE);
        expect((await api.call('GET', '/recipes', as(t))).status).toBe(200);
        await api.revoke(ALICE, t.id);
        expect((await api.call('GET', '/recipes', as(t))).status).toBe(401);
    });

    it('accepts Authorization: Bearer', async () => {
        const res = await api.call('GET', '/recipes', { headers: { Authorization: `Bearer ${alice.token}` } });
        expect(res.status).toBe(200);
    });
    it('accepts the Bearer scheme in any case and lowercase header names', async () => {
        const res = await api.call('GET', '/recipes', { headers: { authorization: `bearer ${alice.token}` } });
        expect(res.status).toBe(200);
    });
    it('accepts X-Api-Key', async () => {
        const res = await api.call('GET', '/recipes', { headers: { 'X-Api-Key': alice.token } });
        expect(res.status).toBe(200);
    });
    it('accepts Basic with the token as the password', async () => {
        const basic = Buffer.from(`anyone:${alice.token}`).toString('base64');
        const res = await api.call('GET', '/recipes', { headers: { Authorization: `Basic ${basic}` } });
        expect(res.status).toBe(200);
    });
    it('accepts Basic with the token alone (no colon)', async () => {
        const basic = Buffer.from(alice.token).toString('base64');
        const res = await api.call('GET', '/recipes', { headers: { Authorization: `Basic ${basic}` } });
        expect(res.status).toBe(200);
    });
    it('accepts a bare token in the Authorization header', async () => {
        const res = await api.call('GET', '/recipes', { headers: { Authorization: alice.token } });
        expect(res.status).toBe(200);
    });

    it.each(readRoutes)('a read-only token may %s %s (not 401/403)', async (method, path) => {
        const res = await api.call(method, path, { ...as(readOnly), body: { id: 'nope' } });
        expect([401, 403]).not.toContain(res.status);
    });

    it.each(writeRoutes)('a read-only token gets 403 on %s %s', async (method, path) => {
        const res = await api.call(method, path, { ...as(readOnly), body: { id: 'x', title: 't' } });
        expect(res.status).toBe(403);
        expect(res.json).toEqual({ error: 'Insufficient scope' });
    });

    it('a read-only token cannot change anything', async () => {
        const r = await create({ title: 'Keep me' });
        await api.call('POST', '/recipes/delete', { ...as(readOnly), body: { id: r._id } });
        await api.call('POST', '/recipes/update', { ...as(readOnly), body: { id: r._id, recipe: { title: 'Changed' } } });
        expect((await api.stored(r._id)).title).toBe('Keep me');
    });

    it('a write-only token cannot read', async () => {
        const w = await api.makeToken(ALICE, ['recipes:write']);
        expect((await api.call('GET', '/recipes', as(w))).status).toBe(403);
        expect((await api.call('POST', '/recipes', { ...as(w), body: { title: 'ok' } })).status).toBe(200);
    });

    it('an unauthenticated unknown path under /recipes is also 401, not a 404/405', async () => {
        const res = await api.call('POST', '/recipes/nonsense', { body: {} });
        expect(res.status).toBe(401);
    });
});

describe('POST /authcheck', () => {
    it('needs no token and reports which auth headers arrived, without the token', async () => {
        const res = await api.call('POST', '/authcheck', { token: alice.token });
        expect(res.status).toBe(200);
        expect(res.json).toEqual({
            auth: { hasAuthorization: true, hasApiKey: false, scheme: 'bearer', tokenLength: alice.token.length },
        });
        expect(res.raw).not.toContain(alice.token);
    });
    it('reports x-api-key and an absent token', async () => {
        const key = await api.call('POST', '/authcheck', { headers: { 'X-Api-Key': 'abc' } });
        expect(key.json.auth).toEqual({ hasAuthorization: false, hasApiKey: true, scheme: 'x-api-key', tokenLength: 3 });
        const none = await api.call('POST', '/authcheck');
        expect(none.status).toBe(200);
        expect(none.json.auth).toEqual({ hasAuthorization: false, hasApiKey: false, scheme: null, tokenLength: 0 });
    });
});

describe('GET /recipes/schema', () => {
    it('returns the RECIPE_SHAPE description including the update semantics', async () => {
        const res = await api.call('GET', '/recipes/schema', as(alice));
        expect(res.status).toBe(200);
        expect(Object.keys(res.json).sort()).toEqual(
            ['categories', 'ingredients', 'instructions', 'rating', 'sources', 'times', 'updateSemantics', 'yields']
        );
        expect(res.json.updateSemantics).toMatch(/replaces the entire ingredient list/);
        expect(Object.keys(res.json.ingredients).sort()).toEqual(['alsoAccepted', 'note', 'preferred', 'stored']);
    });
});

describe('POST /recipes (create)', () => {
    it('returns 200 with the stored recipe, an _id, the owner and timestamps', async () => {
        const before = Date.now();
        const r = await create({ title: 'Toast' });
        expect(r.title).toBe('Toast');
        expect(typeof r._id).toBe('string');
        expect(r.owner.email).toBe(ALICE);
        expect(typeof r.last_modified).toBe('number');
        expect(r.last_modified).toBeGreaterThanOrEqual(before);
        expect(r.last_modified).toBeLessThanOrEqual(Date.now());
        expect((await api.stored(r._id)).title).toBe('Toast');
    });

    it('accepts the recipe wrapped as {recipe: {...}} too', async () => {
        const r = await create({ recipe: { title: 'Wrapped' } });
        expect(r.title).toBe('Wrapped');
    });

    it('keeps a client-supplied last_modified', async () => {
        const r = await create({ title: 'Old', last_modified: 1234567 });
        expect(r.last_modified).toBe(1234567);
    });

    it('parses plain-string ingredients into {text, amount}', async () => {
        const r = await create({ title: 'Cake', ingredients: ['1 1/2 cups flour, sifted', '2 eggs', 'salt'] });
        expect(r.ingredients).toHaveLength(3);
        expect(r.ingredients[0].text).toBe('flour, sifted');
        expect(r.ingredients[0].amount).toMatchObject({ amount: 1.5, unit: 'cups' });
        expect(r.ingredients[1].text).toBe('eggs');
        expect(r.ingredients[1].amount).toMatchObject({ amount: 2 });
        expect(r.ingredients[2].text).toBe('salt');
    });

    it('builds {text, amount} from {amount, unit, ingredient} objects', async () => {
        const r = await create({
            title: 'Cake',
            ingredients: [{ amount: 1.5, unit: 'cups', ingredient: 'flour, sifted' }],
        });
        expect(r.ingredients[0].text).toBe('flour, sifted');
        expect(r.ingredients[0].amount).toMatchObject({ amount: 1.5, unit: 'cups' });
    });

    it('parses a range into amount (upper) and rangeAmount (lower)', async () => {
        const r = await create({ title: 'Range', ingredients: ['2-3 tbsp butter'] });
        expect(r.ingredients[0].text).toBe('butter');
        expect(r.ingredients[0].amount).toMatchObject({ amount: 3, rangeAmount: 2, unit: 'tbsp' });
    });

    it('preserves nested ingredient groups as real sub-lists', async () => {
        const r = await create({
            title: 'Pie',
            ingredients: [
                { text: 'FOR THE DOUGH:', ingredients: ['2 cups flour', '1 tsp salt'] },
                { text: 'FOR THE FILLING:', ingredients: ['3 apples'] },
                '1 egg',
            ],
        });
        expect(r.ingredients).toHaveLength(3);
        expect(r.ingredients[0].text).toBe('FOR THE DOUGH:');
        expect(ingText({ ingredients: r.ingredients[0].ingredients })).toEqual(['flour', 'salt']);
        expect(r.ingredients[0].ingredients[0].amount).toMatchObject({ amount: 2, unit: 'cups' });
        expect(ingText({ ingredients: r.ingredients[1].ingredients })).toEqual(['apples']);
        expect(r.ingredients[2].text).toBe('egg');
    });

    it('turns string categories and sources into {name} objects', async () => {
        const r = await create({ title: 'T', categories: ['dessert', 'easy'], sources: ['Grandma'] });
        expect(r.categories).toEqual([{ name: 'dessert' }, { name: 'easy' }]);
        expect(r.sources).toEqual([{ name: 'Grandma' }]);
    });

    it('leaves object categories and sources (with urls) as they are', async () => {
        const r = await create({ title: 'T', categories: [{ name: 'soup' }], sources: [{ name: 'Site', url: 'http://x.test' }] });
        expect(r.categories).toEqual([{ name: 'soup' }]);
        expect(r.sources).toEqual([{ name: 'Site', url: 'http://x.test' }]);
    });

    it('turns a string `instructions` into one text block', async () => {
        const r = await create({ title: 'T', instructions: 'Mix. Bake.' });
        expect(r.text).toEqual([{ header: 'Instructions', body: 'Mix. Bake.' }]);
    });

    it('turns an array `instructions` into text blocks, header only on the first', async () => {
        const r = await create({ title: 'T', instructions: ['Mix.', 'Bake.'] });
        expect(r.text).toEqual([
            { header: 'Instructions', body: 'Mix.' },
            { header: '', body: 'Bake.' },
        ]);
    });

    it('turns a string `text` into one Instructions block, and prefers an explicit `text` over `instructions`', async () => {
        const a = await create({ title: 'T', text: 'Just do it' });
        expect(a.text).toEqual([{ header: 'Instructions', body: 'Just do it' }]);
        const b = await create({ title: 'T', text: [{ header: 'H', body: 'B' }], instructions: 'ignored' });
        expect(b.text).toEqual([{ header: 'H', body: 'B' }]);
    });

    it('keeps yields, times and rating as sent', async () => {
        const r = await create({
            title: 'T', rating: 4,
            yields: [{ amount: 4, unit: 'servings' }],
            times: [{ name: 'Cook', seconds: 600, text: '10 minutes' }],
        });
        expect(r.rating).toBe(4);
        expect(r.yields).toEqual([{ amount: 4, unit: 'servings' }]);
        expect(r.times).toEqual([{ name: 'Cook', seconds: 600, text: '10 minutes' }]);
    });

    it('stamps the owner from the token, ignoring an owner in the body', async () => {
        const r = await create({ title: 'T', owner: { email: BOB } });
        expect(r.owner.email).toBe(ALICE);
        expect((await api.stored(r._id)).owner.email).toBe(ALICE);
    });

    it('never returns image data but does store it', async () => {
        const r = await create({ title: 'Pic', images: [{ url: IMG, caption: 'c' }] });
        expect(r.images).toEqual([]);
        expect(JSON.stringify(r)).not.toContain('SECRETIMAGEBYTES');
        expect((await api.stored(r._id)).images).toHaveLength(1);
    });

    // DISAGREES WITH YAML: openapi.yaml says `title` is required (RecipeInput),
    // but the code accepts a body without one and stores it.
    it('accepts a recipe with no title (YAML says title is required)', async () => {
        const res = await api.call('POST', '/recipes', { ...as(alice), body: { ingredients: ['1 egg'] } });
        expect(res.status).toBe(200);
    });
});

describe('GET /recipes and POST /recipes/query', () => {
    beforeEach(async () => {
        await create({ title: 'Apple Pie', categories: ['dessert'], ingredients: ['3 apples'], images: [{ url: IMG }] });
        await create({ title: 'Banana Bread', categories: ['dessert', 'bread'] });
        await create({ title: 'Tomato Soup', categories: ['soup'] });
        await create({ title: 'Bob private', categories: ['dessert'] }, bob);
    });
    const titles = (res) => res.json.result.map((r) => r.title).sort();

    it('GET lists only the caller\'s recipes as {count, page, result}', async () => {
        const res = await api.call('GET', '/recipes', as(alice));
        expect(res.status).toBe(200);
        expect(res.json.count).toBe(3);
        expect(typeof res.json.page).toBe('number');
        expect(titles(res)).toEqual(['Apple Pie', 'Banana Bread', 'Tomato Soup']);
    });
    it('GET ?search= filters on full text, case-insensitively', async () => {
        const res = await api.call('GET', '/recipes', { ...as(alice), query: { search: 'banana' } });
        expect(titles(res)).toEqual(['Banana Bread']);
    });
    it('GET ?category= filters on category name', async () => {
        const res = await api.call('GET', '/recipes', { ...as(alice), query: { category: 'dessert' } });
        expect(titles(res)).toEqual(['Apple Pie', 'Banana Bread']);
    });
    it('GET ?limit= caps the page but count stays the total', async () => {
        const res = await api.call('GET', '/recipes', { ...as(alice), query: { limit: '2' } });
        expect(res.json.result).toHaveLength(2);
        expect(res.json.count).toBe(3);
    });
    it('search text is literal, not a regex', async () => {
        const res = await api.call('GET', '/recipes', { ...as(alice), query: { search: '.*' } });
        expect(res.json.result).toEqual([]);
    });
    it('lists most recently modified first', async () => {
        const res = await api.call('GET', '/recipes', as(alice));
        const stamps = res.json.result.map((r) => r.last_modified);
        expect([...stamps].sort((a, b) => b - a)).toEqual(stamps);
    });
    it('list responses never include image data', async () => {
        const res = await api.call('GET', '/recipes', as(alice));
        expect(res.raw).not.toContain('SECRETIMAGEBYTES');
        res.json.result.forEach((r) => expect(r.images || []).toEqual([]));
    });

    it('POST /recipes/query takes search, category and limit in the body', async () => {
        const all = await api.call('POST', '/recipes/query', { ...as(alice), body: {} });
        expect(titles(all)).toEqual(['Apple Pie', 'Banana Bread', 'Tomato Soup']);
        const s = await api.call('POST', '/recipes/query', { ...as(alice), body: { search: 'soup' } });
        expect(titles(s)).toEqual(['Tomato Soup']);
        const c = await api.call('POST', '/recipes/query', { ...as(alice), body: { category: 'bread' } });
        expect(titles(c)).toEqual(['Banana Bread']);
        const l = await api.call('POST', '/recipes/query', { ...as(alice), body: { limit: 1 } });
        expect(l.json.result).toHaveLength(1);
    });
    it('POST /recipes/query never includes image data', async () => {
        const res = await api.call('POST', '/recipes/query', { ...as(alice), body: {} });
        expect(res.raw).not.toContain('SECRETIMAGEBYTES');
    });
    it('a read-only token can query', async () => {
        const res = await api.call('POST', '/recipes/query', { ...as(readOnly), body: {} });
        expect(res.status).toBe(200);
        expect(res.json.count).toBe(3);
    });
    it('does not return recipes flagged deleted', async () => {
        const { getOne } = require('./mongoConnect.js');
        const apple = (await api.call('GET', '/recipes', { ...as(alice), query: { search: 'apple' } })).json.result[0];
        const { loadDB } = require('./mongoConnect.js');
        const { db } = await loadDB();
        await db.collection('recipes').updateOne({ _id: apple._id }, { $set: { deleted: 1 } });
        const res = await api.call('GET', '/recipes', as(alice));
        expect(titles(res)).toEqual(['Banana Bread', 'Tomato Soup']);
        expect(await getOne('recipes', { _id: apple._id })).toBeTruthy();
    });
});

describe('GET /recipes/summary and POST /recipes/summary/query', () => {
    beforeEach(async () => {
        await create({
            title: 'Apple Pie', rating: 5, categories: ['dessert'],
            yields: [{ amount: 8, unit: 'slices' }],
            times: [{ name: 'Bake', seconds: 3600, text: '1 hour' }],
            ingredients: ['3 apples'], instructions: 'Bake it', images: [{ url: IMG }],
        });
        await create({ title: 'Soup', categories: ['soup'] });
        await create({ title: 'Bob pie' }, bob);
    });
    const summaryKeys = ['_id', 'categories', 'last_modified', 'owner', 'rating', 'times', 'title', 'yields'];

    it('GET returns only the summary fields', async () => {
        const res = await api.call('GET', '/recipes/summary', as(alice));
        expect(res.status).toBe(200);
        expect(res.json.count).toBe(2);
        const pie = res.json.result.find((r) => r.title === 'Apple Pie');
        expect(Object.keys(pie).sort()).toEqual(summaryKeys);
        expect(pie.rating).toBe(5);
        expect(pie.categories).toEqual([{ name: 'dessert' }]);
        expect(pie.owner.email).toBe(ALICE);
        expect(res.raw).not.toContain('SECRETIMAGEBYTES');
    });
    it('GET supports search and category', async () => {
        const s = await api.call('GET', '/recipes/summary', { ...as(alice), query: { search: 'soup' } });
        expect(s.json.result.map((r) => r.title)).toEqual(['Soup']);
        const c = await api.call('GET', '/recipes/summary', { ...as(alice), query: { category: 'dessert' } });
        expect(c.json.result.map((r) => r.title)).toEqual(['Apple Pie']);
    });
    it('POST /recipes/summary/query returns summaries filtered by the body', async () => {
        const all = await api.call('POST', '/recipes/summary/query', { ...as(alice), body: {} });
        expect(all.status).toBe(200);
        expect(all.json.count).toBe(2);
        all.json.result.forEach((r) => expect(Object.keys(r).every((k) => summaryKeys.includes(k))).toBe(true));
        const s = await api.call('POST', '/recipes/summary/query', { ...as(alice), body: { search: 'apple', limit: 5 } });
        expect(s.json.result.map((r) => r.title)).toEqual(['Apple Pie']);
    });
    it('a read-only token can read summaries', async () => {
        const res = await api.call('POST', '/recipes/summary/query', { ...as(readOnly), body: {} });
        expect(res.status).toBe(200);
    });
});

describe('GET /recipes/:id and POST /recipes/get', () => {
    it('GET returns the full recipe, ingredients and text included, without images', async () => {
        const made = await create({
            title: 'Full', ingredients: ['2 cups flour'], instructions: 'Stir',
            images: [{ url: IMG }],
        });
        const res = await api.call('GET', `/recipes/${made._id}`, as(alice));
        expect(res.status).toBe(200);
        expect(res.json._id).toBe(made._id);
        expect(res.json.ingredients[0].text).toBe('flour');
        expect(res.json.text[0].body).toBe('Stir');
        expect(res.raw).not.toContain('SECRETIMAGEBYTES');
        expect(res.json.images).toEqual([]);
    });
    it('POST /recipes/get accepts {id} or {_id}', async () => {
        const made = await create({ title: 'Full' });
        const byId = await api.call('POST', '/recipes/get', { ...as(alice), body: { id: made._id } });
        expect(byId.status).toBe(200);
        expect(byId.json.title).toBe('Full');
        const by_id = await api.call('POST', '/recipes/get', { ...as(alice), body: { _id: made._id } });
        expect(by_id.json.title).toBe('Full');
    });
    it('POST /recipes/get with no id is 400 "Missing recipe id"', async () => {
        const res = await api.call('POST', '/recipes/get', { ...as(alice), body: {} });
        expect(res.status).toBe(400);
        expect(res.json).toEqual({ error: 'Missing recipe id' });
    });
    it('a read-only token can get a recipe', async () => {
        const made = await create({ title: 'Full' });
        const res = await api.call('POST', '/recipes/get', { ...as(readOnly), body: { id: made._id } });
        expect(res.status).toBe(200);
    });
});

describe('POST /recipes/update, PATCH and PUT /recipes/:id', () => {
    let rec;
    beforeEach(async () => {
        rec = await create({
            title: 'Soup', rating: 3,
            categories: ['dinner', 'easy'], sources: ['Mom'],
            ingredients: ['1 onion', '2 cups stock', '1 tsp salt'],
            instructions: 'Simmer',
            yields: [{ amount: 4, unit: 'bowls' }],
        });
    });
    const update = (recipe, extra = {}) =>
        api.call('POST', '/recipes/update', { ...as(alice), body: { id: rec._id, recipe, ...extra } });

    it('returns 200 and the updated recipe', async () => {
        const res = await update({ title: 'Better Soup' });
        expect(res.status).toBe(200);
        expect(res.json._id).toBe(rec._id);
        expect(res.json.title).toBe('Better Soup');
    });

    it('a field you omit keeps its stored value', async () => {
        const res = await update({ title: 'Better Soup' });
        expect(res.json.rating).toBe(3);
        expect(res.json.categories).toEqual([{ name: 'dinner' }, { name: 'easy' }]);
        expect(res.json.sources).toEqual([{ name: 'Mom' }]);
        expect(ingText(res.json)).toEqual(['onion', 'stock', 'salt']);
        expect(res.json.text).toEqual([{ header: 'Instructions', body: 'Simmer' }]);
        expect(res.json.yields).toEqual([{ amount: 4, unit: 'bowls' }]);
        const db = await api.stored(rec._id);
        expect(db.rating).toBe(3);
        expect(ingText(db)).toEqual(['onion', 'stock', 'salt']);
    });

    it('a field you send replaces the stored value', async () => {
        const res = await update({ rating: 5, yields: [{ amount: 2, unit: 'cups' }] });
        expect(res.json.rating).toBe(5);
        expect(res.json.yields).toEqual([{ amount: 2, unit: 'cups' }]);
        expect(res.json.title).toBe('Soup');
    });

    it('sending ingredients replaces the whole list; it is not merged with the old one', async () => {
        const res = await update({ ingredients: ['4 carrots'] });
        expect(ingText(res.json)).toEqual(['carrots']);
        expect(ingText(await api.stored(rec._id))).toEqual(['carrots']);
    });

    it('can remove an ingredient by sending the list without it', async () => {
        const res = await update({ ingredients: ['1 onion', '1 tsp salt'] });
        expect(ingText(res.json)).toEqual(['onion', 'salt']);
    });

    it('a replacement ingredient that shares a name with an old one takes the new amount', async () => {
        const res = await update({ ingredients: ['5 onion'] });
        expect(res.json.ingredients).toHaveLength(1);
        expect(res.json.ingredients[0].amount).toMatchObject({ amount: 5 });
    });

    it('replaces a grouped ingredient list wholesale, sub-lists included', async () => {
        await update({ ingredients: [{ text: 'BASE:', ingredients: ['1 a', '2 b'] }, '1 c'] });
        const res = await update({ ingredients: [{ text: 'BASE:', ingredients: ['3 b'] }] });
        expect(res.json.ingredients).toHaveLength(1);
        expect(ingText({ ingredients: res.json.ingredients[0].ingredients })).toEqual(['b']);
    });

    it('sending categories or sources replaces the list, and string forms become objects', async () => {
        const res = await update({ categories: ['lunch'], sources: ['Dad'] });
        expect(res.json.categories).toEqual([{ name: 'lunch' }]);
        expect(res.json.sources).toEqual([{ name: 'Dad' }]);
    });

    it('sending an empty ingredients list clears the stored ingredients', async () => {
        // [] is a field you sent, so it replaces.
        const res = await update({ ingredients: [] });
        expect(res.json.ingredients).toEqual([]);
    });

    it('parses ingredient strings and converts instructions, as create does', async () => {
        const res = await update({ ingredients: ['2 tbsp oil'], instructions: ['Heat.', 'Serve.'] });
        expect(res.json.ingredients[0].text).toBe('oil');
        expect(res.json.ingredients[0].amount).toMatchObject({ amount: 2, unit: 'tbsp' });
        expect(res.json.text).toEqual([{ header: 'Instructions', body: 'Heat.' }, { header: '', body: 'Serve.' }]);
    });

    it('sets last_modified to now and last_remote_save', async () => {
        const before = Date.now();
        const res = await update({ title: 'Later' });
        expect(res.json.last_modified).toBeGreaterThanOrEqual(before);
        expect(res.json.last_remote_save).toBeTruthy();
    });

    it('cannot change _id or owner through the body', async () => {
        const res = await update({ owner: { email: BOB }, title: 'Mine' }, {});
        expect(res.json.owner.email).toBe(ALICE);
        expect(res.json._id).toBe(rec._id);
    });

    it('accepts the fields flat beside id (no `recipe` wrapper)', async () => {
        const res = await api.call('POST', '/recipes/update', { ...as(alice), body: { id: rec._id, title: 'Flat' } });
        expect(res.status).toBe(200);
        expect(res.json.title).toBe('Flat');
        expect(res.json.rating).toBe(3);
    });
    it('accepts the id as _id, or as recipe._id', async () => {
        const a = await api.call('POST', '/recipes/update', { ...as(alice), body: { _id: rec._id, title: 'ViaUnderscore' } });
        expect(a.json.title).toBe('ViaUnderscore');
        const b = await api.call('POST', '/recipes/update', { ...as(alice), body: { recipe: { _id: rec._id, title: 'ViaRecipe' } } });
        expect(b.json.title).toBe('ViaRecipe');
    });

    it('PATCH /recipes/:id and PUT /recipes/:id update with the same field-level semantics', async () => {
        const p = await api.call('PATCH', `/recipes/${rec._id}`, { ...as(alice), body: { title: 'Patched', ingredients: ['1 leek'] } });
        expect(p.status).toBe(200);
        expect(p.json.title).toBe('Patched');
        expect(ingText(p.json)).toEqual(['leek']);
        expect(p.json.rating).toBe(3);
        const u = await api.call('PUT', `/recipes/${rec._id}`, { ...as(alice), body: { recipe: { title: 'Put' } } });
        expect(u.status).toBe(200);
        expect(u.json.title).toBe('Put');
        expect(ingText(u.json)).toEqual(['leek']);
    });

    it('no id is 400 "Missing recipe id" on update, PATCH and PUT', async () => {
        const a = await api.call('POST', '/recipes/update', { ...as(alice), body: { recipe: { title: 'x' } } });
        expect(a.status).toBe(400);
        expect(a.json).toEqual({ error: 'Missing recipe id' });
        for (const m of ['PATCH', 'PUT']) {
            const r = await api.call(m, '/recipes', { ...as(alice), body: { title: 'x' } });
            expect(r.status).toBe(400);
            expect(r.json).toEqual({ error: 'Missing recipe id' });
        }
    });

    it('an unknown id is 404 and creates nothing', async () => {
        const res = await api.call('POST', '/recipes/update', { ...as(alice), body: { id: 'nope', recipe: { title: 'x' } } });
        expect(res.status).toBe(404);
        expect(res.json).toEqual({ error: 'No recipe found with id nope' });
        expect(await api.stored('nope')).toBeNull();
        const patch = await api.call('PATCH', '/recipes/nope', { ...as(alice), body: { title: 'x' } });
        expect(patch.status).toBe(404);
    });

    it('never returns image data from an update', async () => {
        const withImg = await create({ title: 'Pic', images: [{ url: IMG }] });
        const res = await api.call('POST', '/recipes/update', { ...as(alice), body: { id: withImg._id, recipe: { title: 'Pic2' } } });
        expect(res.status).toBe(200);
        expect(res.raw).not.toContain('SECRETIMAGEBYTES');
    });

    it('a recipe stored with images still has them in the database after a REST update that sends no images', async () => {
        const withImg = await create({
            title: 'Pic', ingredients: ['1 a'],
            images: [{ url: IMG, caption: 'one' }, { url: IMG + '2', caption: 'two' }],
        });
        expect((await api.stored(withImg._id)).images).toHaveLength(2);
        // Several kinds of update, none sending images.
        await api.call('POST', '/recipes/update', { ...as(alice), body: { id: withImg._id, recipe: { title: 'Pic2' } } });
        await api.call('PATCH', `/recipes/${withImg._id}`, { ...as(alice), body: { ingredients: ['2 b'], categories: ['x'] } });
        await api.call('PUT', `/recipes/${withImg._id}`, { ...as(alice), body: { rating: 2 } });
        const after = await api.stored(withImg._id);
        expect(after.title).toBe('Pic2');
        expect(after.images).toEqual([
            { url: IMG, caption: 'one' },
            { url: IMG + '2', caption: 'two' },
        ]);
    });

    it('a read-only token cannot update', async () => {
        const res = await api.call('POST', '/recipes/update', { ...as(readOnly), body: { id: rec._id, recipe: { title: 'No' } } });
        expect(res.status).toBe(403);
    });
});

describe('DELETE /recipes/:id and POST /recipes/delete', () => {
    it('POST /recipes/delete returns 200 with the count 1 and removes the recipe', async () => {
        const r = await create({ title: 'Gone' });
        const res = await api.call('POST', '/recipes/delete', { ...as(alice), body: { id: r._id } });
        expect(res.status).toBe(200);
        expect(res.json).toBe(1);
        expect(await api.stored(r._id)).toBeNull();
    });
    it('POST /recipes/delete accepts _id too', async () => {
        const r = await create({ title: 'Gone' });
        const res = await api.call('POST', '/recipes/delete', { ...as(alice), body: { _id: r._id } });
        expect(res.json).toBe(1);
    });
    it('DELETE /recipes/:id removes it and returns 1', async () => {
        const r = await create({ title: 'Gone' });
        const res = await api.call('DELETE', `/recipes/${r._id}`, as(alice));
        expect(res.status).toBe(200);
        expect(res.json).toBe(1);
        expect(await api.stored(r._id)).toBeNull();
    });
    it('deleted recipes no longer list', async () => {
        const r = await create({ title: 'Gone' });
        await api.call('DELETE', `/recipes/${r._id}`, as(alice));
        const res = await api.call('GET', '/recipes', as(alice));
        expect(res.json.count).toBe(0);
    });
    it('no id is 400 "Missing recipe id" on POST /recipes/delete and DELETE /recipes', async () => {
        const a = await api.call('POST', '/recipes/delete', { ...as(alice), body: {} });
        expect(a.status).toBe(400);
        expect(a.json).toEqual({ error: 'Missing recipe id' });
        const b = await api.call('DELETE', '/recipes', as(alice));
        expect(b.status).toBe(400);
        expect(b.json).toEqual({ error: 'Missing recipe id' });
    });
    it('a read-only token cannot delete', async () => {
        const r = await create({ title: 'Safe' });
        const res = await api.call('DELETE', `/recipes/${r._id}`, as(readOnly));
        expect(res.status).toBe(403);
        expect(await api.stored(r._id)).toBeTruthy();
    });
});

describe('POST /recipes/reparse-ingredients', () => {
    async function storeUnparsed() {
        const r = await create({ title: 'Old' });
        const { loadDB } = require('./mongoConnect.js');
        const { db } = await loadDB();
        await db.collection('recipes').updateOne(
            { _id: r._id },
            { $set: { ingredients: [{ text: '250g all-purpose flour' }] } }
        );
        return r;
    }
    it('is a dry run by default: reports what would change and writes nothing', async () => {
        const r = await storeUnparsed();
        const res = await api.call('POST', '/recipes/reparse-ingredients', { ...as(alice), body: {} });
        expect(res.status).toBe(200);
        expect(res.json.dryRun).toBe(true);
        expect(res.json.total).toBe(1);
        expect(res.json.scanned).toBe(1);
        expect(res.json.done).toBe(true);
        expect(res.json.recipesChanged).toBe(1);
        expect(res.json.ingredientsChanged).toBeGreaterThanOrEqual(1);
        expect(res.json.recipes[0]._id).toBe(r._id);
        expect((await api.stored(r._id)).ingredients).toEqual([{ text: '250g all-purpose flour' }]);
    });
    it('with dryRun:false repairs the stored ingredients and keeps last_modified', async () => {
        const r = await storeUnparsed();
        const before = (await api.stored(r._id)).last_modified;
        const res = await api.call('POST', '/recipes/reparse-ingredients', { ...as(alice), body: { dryRun: false } });
        expect(res.status).toBe(200);
        expect(res.json.dryRun).toBe(false);
        const after = await api.stored(r._id);
        expect(after.ingredients[0].text).toBe('all-purpose flour');
        expect(after.ingredients[0].amount).toMatchObject({ amount: 250 });
        expect(after.last_modified).toBe(before);
    });
    it('has the documented response keys', async () => {
        const res = await api.call('POST', '/recipes/reparse-ingredients', { ...as(alice) });
        expect(res.status).toBe(200);
        ['dryRun', 'total', 'scanned', 'nextOffset', 'done', 'recipesChanged', 'ingredientsChanged', 'stillUnparsedCount', 'recipes']
            .forEach((k) => expect(res.json).toHaveProperty(k));
    });
});

describe('one user cannot touch another user\'s recipes', () => {
    let bobs;
    beforeEach(async () => {
        bobs = await create({ title: 'Bob secret', ingredients: ['1 truffle'] }, bob);
    });
    it('cannot read it by GET or POST /recipes/get (an error, never the recipe)', async () => {
        const a = await api.call('GET', `/recipes/${bobs._id}`, as(alice));
        expect(a.status).toBeGreaterThanOrEqual(400);
        expect(a.raw).not.toContain('Bob secret');
        const b = await api.call('POST', '/recipes/get', { ...as(alice), body: { id: bobs._id } });
        expect(b.status).toBeGreaterThanOrEqual(400);
        expect(b.raw).not.toContain('Bob secret');
    });
    it('does not see it in lists, summaries or searches', async () => {
        for (const [m, p, o] of [
            ['GET', '/recipes', {}], ['GET', '/recipes/summary', {}],
            ['POST', '/recipes/query', { body: { search: 'secret' } }],
            ['POST', '/recipes/summary/query', { body: { search: 'secret' } }],
        ]) {
            const res = await api.call(m, p, { ...as(alice), ...o });
            expect(res.json.result).toEqual([]);
            expect(res.json.count).toBe(0);
        }
    });
    it('cannot update it (404) and it is unchanged', async () => {
        for (const [m, p, body] of [
            ['POST', '/recipes/update', { id: bobs._id, recipe: { title: 'Hacked', ingredients: ['1 dirt'] } }],
            ['PATCH', `/recipes/${bobs._id}`, { title: 'Hacked' }],
            ['PUT', `/recipes/${bobs._id}`, { title: 'Hacked' }],
        ]) {
            const res = await api.call(m, p, { ...as(alice), body });
            expect(res.status).toBe(404);
        }
        const db = await api.stored(bobs._id);
        expect(db.title).toBe('Bob secret');
        expect(db.owner.email).toBe(BOB);
        expect(ingText(db)).toEqual(['truffle']);
    });
    it('cannot delete it and it is still there', async () => {
        const a = await api.call('POST', '/recipes/delete', { ...as(alice), body: { id: bobs._id } });
        expect(a.status).toBeGreaterThanOrEqual(400);
        const b = await api.call('DELETE', `/recipes/${bobs._id}`, as(alice));
        expect(b.status).toBeGreaterThanOrEqual(400);
        expect(await api.stored(bobs._id)).toBeTruthy();
    });
    it('the owner can still read it', async () => {
        const res = await api.call('GET', `/recipes/${bobs._id}`, as(bob));
        expect(res.status).toBe(200);
        expect(res.json.title).toBe('Bob secret');
    });
});

describe('errors', () => {
    const errorShape = (res) => {
        expect(Object.keys(res.json)).toEqual(['error']);
        expect(typeof res.json.error).toBe('string');
    };

    it('401, 403, 400, 404 and 405 bodies hold only an `error` string', async () => {
        errorShape(await api.call('GET', '/recipes'));
        errorShape(await api.call('POST', '/recipes', { ...as(readOnly), body: { title: 'x' } }));
        errorShape(await api.call('POST', '/recipes/get', { ...as(alice), body: {} }));
        errorShape(await api.call('POST', '/recipes/update', { ...as(alice), body: { id: 'nope', title: 'x' } }));
        errorShape(await api.call('POST', '/recipes/nonsense', { ...as(alice), body: {} }));
    });

    it('POST to an unknown /recipes/<word> is 405 "Method not allowed"', async () => {
        const res = await api.call('POST', '/recipes/nonsense', { ...as(alice), body: {} });
        expect(res.status).toBe(405);
        expect(res.json).toEqual({ error: 'Method not allowed' });
    });
    it('an unsupported HTTP method is 405', async () => {
        const res = await api.call('OPTIONS', '/recipes', as(alice));
        expect(res.status).toBe(405);
    });

    // DISAGREES WITH TASK EXPECTATION ("unknown id is 404"): only update/PATCH/PUT
    // answer 404. Reading or deleting an unknown id answers 500, because
    // getRecipe/deleteRecipe throw an Error with no statusCode. Pinned as is.
    it('GET /recipes/:id for an unknown id is currently 500 (not 404)', async () => {
        const res = await api.call('GET', '/recipes/does-not-exist', as(alice));
        expect(res.status).toBe(500);
        errorShape(res);
    });
    it('POST /recipes/get for an unknown id is currently 500 (not 404)', async () => {
        const res = await api.call('POST', '/recipes/get', { ...as(alice), body: { id: 'does-not-exist' } });
        expect(res.status).toBe(500);
    });
    it('deleting an unknown id is currently 500 (not 404)', async () => {
        const a = await api.call('POST', '/recipes/delete', { ...as(alice), body: { id: 'does-not-exist' } });
        expect(a.status).toBe(500);
        const b = await api.call('DELETE', '/recipes/does-not-exist', as(alice));
        expect(b.status).toBe(500);
    });

    // BUG (unfixed, not ours to fix here): the 500 message for an unknown id
    // is "No recipe found for user <email>, _id <id>. Last DB result was ...",
    // which puts the caller's account email (and a stringified DB result) in the
    // body. The brief says error bodies should say nothing about the user.
    it.skip('BUG: an unknown-id error body does not mention the user email', async () => {
        const res = await api.call('GET', '/recipes/does-not-exist', as(alice));
        expect(res.raw).not.toContain(ALICE);
    });
    it.skip('BUG: an unknown-id error is 404, not 500', async () => {
        const res = await api.call('GET', '/recipes/does-not-exist', as(alice));
        expect(res.status).toBe(404);
    });
    it('the 500 error body does at least never include the token', async () => {
        const res = await api.call('GET', '/recipes/does-not-exist', as(alice));
        expect(res.raw).not.toContain(alice.token);
    });

    it('a malformed JSON body throws out of the handler (no JSON error response)', async () => {
        const { handler } = require('./api.js');
        await expect(handler({
            httpMethod: 'POST', path: '/.netlify/functions/api/recipes',
            headers: { Authorization: `Bearer ${alice.token}` }, body: '{nope',
        }, {})).rejects.toThrow();
    });
});
