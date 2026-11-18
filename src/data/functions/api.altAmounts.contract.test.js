/**
   REST API contract tests for multiple measures per ingredient (card R5-3).

   Additive only: `altAmounts` is a new optional field on an ingredient.
   Recipes that never use it must come back exactly as before; the original
   contract tests in api.contract.test.js are untouched and cover that too.
   These cover the new field: sent explicitly, parsed out of the text, sent
   back on update, and the parentheticals that must NOT be touched.
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

describe('GET /recipes/schema mentions altAmounts, additively', () => {
    it('describes the field without changing the existing keys', async () => {
        const res = await api.call('GET', '/recipes/schema', as(alice));
        expect(res.status).toBe(200);
        expect(Object.keys(res.json.ingredients).sort()).toEqual(['alsoAccepted', 'note', 'preferred', 'stored']);
        expect(res.json.ingredients.preferred.altAmounts).toMatch(/further measures/);
        expect(res.json.ingredients.stored.altAmounts).toMatch(/primary/);
        // the existing keys are all still there
        expect(Object.keys(res.json.ingredients.stored.amount).sort())
            .toEqual(['amount', 'rangeAmount', 'standardUnit', 'unit']);
    });
});

describe('altAmounts sent explicitly', () => {
    it('is stored and returned, with standardUnit filled in', async () => {
        const r = await create({
            title: 'Cookies',
            ingredients: [{
                amount: 2, unit: 'sticks', ingredient: 'butter, softened',
                altAmounts: [{ amount: 225, unit: 'g' }],
            }],
        });
        const ing = r.ingredients[0];
        expect(ing.text).toBe('butter, softened');
        expect(ing.amount).toMatchObject({ amount: 2, unit: 'sticks' });
        expect(ing.altAmounts).toEqual([{ amount: 225, unit: 'g', standardUnit: 'g' }]);
        const db = await api.stored(r._id);
        expect(db.ingredients[0].altAmounts).toEqual([{ amount: 225, unit: 'g', standardUnit: 'g' }]);
    });

    it('accepts strings and several measures', async () => {
        const r = await create({
            title: 'T',
            ingredients: [{ amount: 1, unit: 'cup', ingredient: 'milk', altAmounts: ['240 ml', '8 fl oz'] }],
        });
        expect(r.ingredients[0].altAmounts.map((a) => [a.amount, a.unit])).toEqual([[240, 'ml'], [8, 'fl oz']]);
    });

    it('works on a canonical {text, amount, altAmounts} and inside a group', async () => {
        const r = await create({
            title: 'T',
            ingredients: [{
                text: 'FOR THE DOUGH:',
                ingredients: [{ text: 'flour', amount: { amount: 2, unit: 'cups' }, altAmounts: [{ amount: 240, unit: 'g' }] }],
            }],
        });
        expect(r.ingredients[0].ingredients[0].altAmounts).toEqual([{ amount: 240, unit: 'g', standardUnit: 'g' }]);
    });

    it('an explicit [] is accepted, not stored, and stops the text being searched', async () => {
        const r = await create({
            title: 'T',
            ingredients: [{ amount: 285, unit: 'g', ingredient: 'butter (2 sticks)', altAmounts: [] }],
        });
        expect(r.ingredients[0].text).toBe('butter (2 sticks)');
        expect('altAmounts' in r.ingredients[0]).toBe(false);
    });

    it('drops junk entries instead of failing', async () => {
        const r = await create({
            title: 'T',
            ingredients: [{ amount: 1, unit: 'cup', ingredient: 'milk', altAmounts: [null, {}, 'a lot', { amount: 240, unit: 'ml' }] }],
        });
        expect(r.ingredients[0].altAmounts).toEqual([{ amount: 240, unit: 'ml', standardUnit: 'ml' }]);
    });
});

describe('altAmounts parsed out of the ingredient text', () => {
    it('reads "2 sticks (225 g) butter" from a plain string', async () => {
        const r = await create({ title: 'T', ingredients: ['2 sticks (225 g) butter'] });
        // `stick` is not one of Gourmet's units, so the primary parse is as it
        // always was; the clean extra measure is still pulled out.
        expect(r.ingredients[0].altAmounts).toEqual([
            { amount: 225, textAmount: '225', unit: 'g', standardUnit: 'g' },
        ]);
        expect(r.ingredients[0].text).not.toMatch(/225/);
    });

    it('reads "240 g (2 cups) flour"', async () => {
        const r = await create({ title: 'T', ingredients: ['240 g (2 cups) flour'] });
        const ing = r.ingredients[0];
        expect(ing.text).toBe('flour');
        expect(ing.amount).toMatchObject({ amount: 240, unit: 'g' });
        expect(ing.altAmounts).toHaveLength(1);
        expect(ing.altAmounts[0]).toMatchObject({ amount: 2, unit: 'cups', standardUnit: 'c' });
    });

    it('reads "flour (2 cups)": the only measure becomes the amount', async () => {
        const r = await create({ title: 'T', ingredients: ['flour (2 cups)'] });
        expect(r.ingredients[0].text).toBe('flour');
        expect(r.ingredients[0].amount).toMatchObject({ amount: 2, unit: 'cups' });
        expect(r.ingredients[0].altAmounts).toBeUndefined();
    });

    it('reads "2 cups / 240 g flour"', async () => {
        const r = await create({ title: 'T', ingredients: ['2 cups / 240 g flour'] });
        const ing = r.ingredients[0];
        expect(ing.text).toBe('flour');
        expect(ing.amount).toMatchObject({ amount: 2, unit: 'cups' });
        expect(ing.altAmounts[0]).toMatchObject({ amount: 240, unit: 'g' });
    });

    it('reads what an agent writes: {amount, unit} with the other measure in the text', async () => {
        const r = await create({
            title: 'T',
            ingredients: [
                { amount: 285, unit: 'g', ingredient: 'unsalted butter (2 1/2 sticks)' },
                { amount: 420, unit: 'g', ingredient: 'all-purpose flour (3 3/4 cups)' },
                { amount: 5, unit: 'g', ingredient: 'vanilla extract (15 ml)' },
            ],
        });
        expect(r.ingredients.map((i) => i.text)).toEqual(['unsalted butter', 'all-purpose flour', 'vanilla extract']);
        expect(r.ingredients[0].amount).toMatchObject({ amount: 285, unit: 'g' });
        expect(r.ingredients[0].altAmounts[0]).toMatchObject({ amount: 2.5, unit: 'sticks' });
        expect(r.ingredients[1].altAmounts[0]).toMatchObject({ amount: 3.75, unit: 'cups', standardUnit: 'c' });
        expect(r.ingredients[2].altAmounts[0]).toMatchObject({ amount: 15, unit: 'ml', standardUnit: 'ml' });
        // the line as written is kept
        expect(r.ingredients[0].originalText).toBe('unsalted butter (2 1/2 sticks)');
    });

    it('leaves parentheticals that are not measures exactly as they were', async () => {
        const r = await create({
            title: 'T',
            ingredients: [
                { amount: 2, unit: 'cups', ingredient: 'flour (optional)' },
                { amount: 3, ingredient: 'lemons (about 3 lemons)' },
                { amount: 1, unit: 'can', ingredient: 'tomatoes (14 oz)' },
                '1 tsp salt (see note)',
                { amount: 1, ingredient: 'potato (1 large)' },
            ],
        });
        for (const ing of r.ingredients) { expect('altAmounts' in ing).toBe(false); }
        expect(r.ingredients[0].text).toBe('flour (optional)');
        expect(r.ingredients[1].text).toBe('lemons (about 3 lemons)');
        expect(r.ingredients[2].text).toBe('tomatoes (14 oz)');
        expect(r.ingredients[3].text).toBe('salt (see note)');
        expect(r.ingredients[4].text).toBe('potato (1 large)');
    });
});

describe('recipes without altAmounts are unchanged', () => {
    it('an ingredient with one measure has no altAmounts key at all', async () => {
        const r = await create({ title: 'T', ingredients: ['1 1/2 cups flour, sifted', { amount: 2, unit: 'cups', ingredient: 'stock' }] });
        expect('altAmounts' in r.ingredients[0]).toBe(false);
        expect('altAmounts' in r.ingredients[1]).toBe(false);
        expect(JSON.stringify(await api.stored(r._id))).not.toContain('altAmounts');
    });

    it('a recipe stored before the field existed reads back as stored', async () => {
        const r = await create({ title: 'Old' });
        const { loadDB } = require('./mongoConnect.js');
        const { db } = await loadDB();
        const old = [{ text: 'butter (2 sticks)', amount: { amount: 285, unit: 'g', standardUnit: 'g' } }];
        await db.collection('recipes').updateOne({ _id: r._id }, { $set: { ingredients: old } });
        const res = await api.call('GET', `/recipes/${r._id}`, as(alice));
        expect(res.status).toBe(200);
        expect(res.json.ingredients).toEqual(old); // reads do not parse or rewrite
    });
});

describe('altAmounts survive an update', () => {
    it('a field you omit keeps its stored value, altAmounts included', async () => {
        const r = await create({
            title: 'T',
            ingredients: [{ amount: 2, unit: 'cups', ingredient: 'flour', altAmounts: [{ amount: 240, unit: 'g' }] }],
        });
        const res = await api.call('POST', '/recipes/update', { ...as(alice), body: { id: r._id, recipe: { title: 'T2' } } });
        expect(res.status).toBe(200);
        expect(res.json.ingredients[0].altAmounts).toHaveLength(1);
    });

    it('sending the list back with altAmounts keeps them; sending it without drops them (lists are replaced)', async () => {
        const r = await create({
            title: 'T',
            ingredients: [{ amount: 2, unit: 'cups', ingredient: 'flour', altAmounts: [{ amount: 240, unit: 'g' }] }],
        });
        const back = await api.call('PUT', `/recipes/${r._id}`, { ...as(alice), body: { ingredients: r.ingredients } });
        expect(back.status).toBe(200);
        expect(back.json.ingredients[0].altAmounts).toEqual([{ amount: 240, unit: 'g', standardUnit: 'g' }]);
        expect(back.json.ingredients[0].text).toBe('flour');
        const without = await api.call('PUT', `/recipes/${r._id}`, {
            ...as(alice),
            body: { ingredients: [{ amount: 2, unit: 'cups', ingredient: 'flour' }] },
        });
        expect('altAmounts' in without.json.ingredients[0]).toBe(false);
    });

    it('altAmounts can be added on update', async () => {
        const r = await create({ title: 'T', ingredients: ['2 cups flour'] });
        const res = await api.call('POST', '/recipes/update', {
            ...as(alice),
            body: { id: r._id, recipe: { ingredients: ['2 cups (240 g) flour'] } },
        });
        expect(res.json.ingredients[0].altAmounts[0]).toMatchObject({ amount: 240, unit: 'g' });
    });
});
