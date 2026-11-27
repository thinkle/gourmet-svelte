// A recipe may name the palette it wears, from the app's designed set.
import { startApi } from '../../src/data/functions/testing/apiHarness.js';

let api;
let token;
beforeAll(async () => { api = await startApi(); });
afterAll(async () => { if (api) await api.stop(); });
beforeEach(async () => {
  await api.reset();
  ({ token } = await api.makeToken('palette@example.invalid'));
});

const create = (body) => api.call('POST', '/recipes', { token, body });

it('lists every palette with its colours, for choosing one', async () => {
  const listed = await api.call('GET', '/recipes/palettes', { token });
  expect(listed.status).toBe(200);
  const names = listed.json.palettes.map((p) => p.name);
  expect(names).toContain('chocolate');
  expect(names).toContain('house');
  expect(new Set(names).size).toBe(names.length);
  expect(listed.json.palettes[0]).toEqual({
    name: expect.any(String), bg: expect.any(String), fg: expect.any(String), accent: expect.any(String),
  });
  expect((await api.call('POST', '/recipes/palettes', { token, body: {} })).status).toBe(405);
  expect((await api.call('GET', '/recipes/palettes', {})).status).toBe(401);
});

it('stores a named palette and gives it back', async () => {
  const created = await create({ title: 'Yule Log', palette: 'christmas' });
  expect(created.status).toBe(200);
  expect(created.json.palette).toBe('christmas');
  expect((await api.stored(created.json._id)).palette).toBe('christmas');
  const read = await api.call('GET', `/recipes/${created.json._id}`, { token });
  expect(read.json.palette).toBe('christmas');
});

it('takes a name however it was typed', async () => {
  const created = await create({ title: 'Yule Log', palette: '  Christmas ' });
  expect(created.json.palette).toBe('christmas');
});

it('refuses a palette it does not have, and says where to look', async () => {
  const bad = await create({ title: 'Yule Log', palette: 'neon-chartreuse' });
  expect(bad.status).toBe(400);
  expect(bad.json.error).toMatch(/No palette called "neon-chartreuse"\..*\/recipes\/palettes/);
  expect((await create({ title: 'Nope', palette: { bg: '#fff' } })).status).toBe(400);
  const all = await api.call('POST', '/recipes/query', { token, body: {} });
  expect(all.json.result).toEqual([]);
});

it('changes and clears the palette on an update, and leaves it alone otherwise', async () => {
  const id = (await create({ title: 'Yule Log', palette: 'christmas' })).json._id;
  await api.call('PATCH', `/recipes/${id}`, { token, body: { title: 'Chocolate log' } });
  expect((await api.stored(id)).palette).toBe('christmas');
  await api.call('PATCH', `/recipes/${id}`, { token, body: { palette: 'chocolate' } });
  expect((await api.stored(id)).palette).toBe('chocolate');
  for (const clearing of ['', null]) {
    await api.call('PATCH', `/recipes/${id}`, { token, body: { palette: clearing } });
    expect((await api.stored(id)).palette).toBe('');
  }
  const bad = await api.call('PATCH', `/recipes/${id}`, { token, body: { palette: 'nope' } });
  expect(bad.status).toBe(400);
  expect((await api.stored(id)).title).toBe('Chocolate log');
});

it('leaves recipes that name no palette exactly as they were', async () => {
  const created = await create({ title: 'Carrot Soup' });
  expect(created.json.palette).toBeUndefined();
  expect((await api.stored(created.json._id)).palette).toBeUndefined();
});

it('tells a client asking for the schema how palettes work, and how photos do', async () => {
  const schema = await api.call('GET', '/recipes/schema', { token });
  expect(schema.json.palette).toMatch(/\/recipes\/palettes/);
  // The images entry is an object, so it must survive the image stripper.
  expect(schema.json.images.writing).toMatch(/imageUrls/);
  expect(schema.json.imageCount).toBeUndefined();
});
