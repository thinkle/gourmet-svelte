// All writes in this suite use the in-memory Mongo server only.
import { startApi } from '../../src/data/functions/testing/apiHarness.js';
let api, token;
beforeAll(async () => { api = await startApi(); });
afterAll(async () => { if (api) await api.stop(); });
beforeEach(async () => { await api.reset(); ({ token } = await api.makeToken('links@example.test')); });
it('preserves structured linked ingredients on create, GET and partial update', async () => {
    const target = await api.call('POST', '/recipes', { token, body: { title: 'Filling', ingredients: ['2 kg apples'] } });
    expect(target.status).toBe(200);
    const reference = target.json._id;
    const created = await api.call('POST', '/recipes', { token, body: {
        title: 'Pie', ingredients: [{ text: 'For the pie', ingredients: [{ text: 'Filling', reference, amount: { amount: 0.5 } }] }],
    } });
    expect(created.status).toBe(200);
    const id = created.json._id;
    const read = await api.call('GET', `/recipes/${id}`, { token });
    expect(read.status).toBe(200);
    expect(read.json.ingredients[0].ingredients[0]).toMatchObject({ reference, text: 'Filling', amount: { amount: 0.5 } });
    const updated = await api.call('PATCH', `/recipes/${id}`, { token, body: { title: 'Apple pie' } });
    expect(updated.status).toBe(200);
    expect(updated.json.ingredients).toEqual(read.json.ingredients);
    const replaced = await api.call('PATCH', `/recipes/${id}`, { token, body: { ingredients: read.json.ingredients } });
    expect(replaced.status).toBe(200);
    expect(replaced.json.ingredients[0].ingredients[0].reference).toBe(reference);
});

it('documents links through the existing schema keys', async () => {
    const read = await api.call('GET', '/recipes/schema', { token });
    expect(read.status).toBe(200);
    expect(Object.keys(read.json.ingredients).sort()).toEqual(['alsoAccepted', 'note', 'preferred', 'stored']);
    expect(read.json.ingredients.stored.reference).toMatch(/linked recipe _id/);
    expect(read.json.ingredients.alsoAccepted.join(' ')).toMatch(/reference.*recipe-id-from-search/);
});
