/**
   REST API contract tests for the agent-facing additions (rb/agent-api).

   Additive only: `shopItem` is filled on ingredients when a client did not
   send one; text bodies (with the scalable <amount> markup) pass through
   untouched; the schema documents both inside its existing keys. The
   original contract tests are untouched.
**/
import { startApi } from './testing/apiHarness.js';

const ALICE = 'alice@example.test';

let api;
let alice;

beforeAll(async () => {
    api = await startApi();
});
afterAll(async () => {
    if (api) { await api.stop(); }
});
beforeEach(async () => {
    await api.reset();
    alice = await api.makeToken(ALICE);
});

const as = (who) => ({ token: who.token });
async function create(body) {
    const res = await api.call('POST', '/recipes', { ...as(alice), body });
    expect(res.status).toBe(200);
    return res.json;
}

describe('shopItem', () => {
    it('is filled from the text on create, for strings, structured and grouped ingredients', async () => {
        const r = await create({
            title: 'Cake',
            ingredients: [
                '2 large eggs, beaten',
                { amount: 285, unit: 'g', ingredient: 'unsalted butter (2 1/2 sticks)' },
                { text: 'For the top:', ingredients: ['1 (14 oz) can diced tomatoes', 'freshly ground black pepper'] },
            ],
        });
        // (the kept parser reads "large" as the unit here; shopItem is the same either way)
        expect(r.ingredients[0].shopItem).toBe('eggs');
        expect(r.ingredients[1]).toMatchObject({ text: 'unsalted butter', shopItem: 'butter' });
        expect(r.ingredients[1].altAmounts).toHaveLength(1);
        expect(r.ingredients[2].shopItem).toBeUndefined(); // a group heading gets none
        expect(r.ingredients[2].ingredients.map((i) => i.shopItem)).toEqual(['diced tomatoes', 'black pepper']);
        const db = await api.stored(r._id);
        expect(db.ingredients[0].shopItem).toBe('eggs');
    });

    it('a shopItem or ingkey sent by the client always wins', async () => {
        const r = await create({
            title: 'Mine',
            ingredients: [
                { ingredient: 'large eggs', shopItem: 'Eggs (free range)' },
                { text: 'unsalted butter', ingkey: 'unsalted butter' },
            ],
        });
        expect(r.ingredients[0].shopItem).toBe('Eggs (free range)');
        expect(r.ingredients[1].shopItem).toBeUndefined();
        expect(r.ingredients[1].ingkey).toBe('unsalted butter');
    });

    it('is not invented when no item is left', async () => {
        const r = await create({ title: 'T', ingredients: [{ text: 'to taste' }] });
        expect(r.ingredients[0].shopItem).toBeUndefined();
    });

    it('is filled on update too, and a recipe written without ingredients is not given any', async () => {
        const r = await create({ title: 'T' });
        const res = await api.call('PUT', `/recipes/${r._id}`, { ...as(alice), body: { ingredients: ['1 cup all-purpose flour, sifted'] } });
        expect(res.status).toBe(200);
        expect(res.json.ingredients[0].shopItem).toBe('flour');
        const t = await api.call('PUT', `/recipes/${r._id}`, { ...as(alice), body: { title: 'T2' } });
        expect(t.json.ingredients[0].shopItem).toBe('flour');
    });
});

describe('text bodies with <amount> markup', () => {
    const BODY = '<p>Beat in <amount>2</amount> eggs, then <amount>1 1/2 cups</amount> milk. Bake for 20 minutes.</p>';

    it('pass through create and GET byte for byte', async () => {
        const r = await create({ title: 'T', text: [{ header: 'Batter', body: BODY }, { header: 'Bake', body: 'Plain <amount>2-3</amount> minutes' }] });
        expect(r.text).toEqual([{ header: 'Batter', body: BODY }, { header: 'Bake', body: 'Plain <amount>2-3</amount> minutes' }]);
        const got = await api.call('GET', `/recipes/${r._id}`, as(alice));
        expect(got.json.text[0].body).toBe(BODY);
    });

    it('updating `text` keeps several blocks; `instructions` replaces them all', async () => {
        const r = await create({ title: 'T', text: [{ header: 'A', body: 'one' }, { header: 'B', body: 'two' }] });
        const keep = await api.call('PUT', `/recipes/${r._id}`, {
            ...as(alice), body: { text: [{ header: 'A', body: BODY }, { header: 'B', body: 'two' }] },
        });
        expect(keep.json.text).toEqual([{ header: 'A', body: BODY }, { header: 'B', body: 'two' }]);
        const collapse = await api.call('PUT', `/recipes/${r._id}`, { ...as(alice), body: { instructions: BODY } });
        expect(collapse.json.text).toEqual([{ header: 'Instructions', body: BODY }]);
    });
});

describe('GET /recipes/schema documents the agent additions inside existing keys', () => {
    it('mentions shopItem, the HTML subset, <amount> and the text trap', async () => {
        const res = await api.call('GET', '/recipes/schema', as(alice));
        expect(res.status).toBe(200);
        expect(res.json.ingredients.preferred.shopItem).toMatch(/bare item/);
        expect(res.json.ingredients.stored.shopItem).toMatch(/shopping list/);
        expect(res.json.instructions).toMatch(/<amount>2<\/amount>/);
        expect(res.json.instructions).toMatch(/p br h2 .* amount/);
        expect(res.json.instructions).toMatch(/REPLACES ALL stored text blocks/);
        expect(res.json.updateSemantics).toMatch(/text: \[\{header, body\}\]/);
    });
});
