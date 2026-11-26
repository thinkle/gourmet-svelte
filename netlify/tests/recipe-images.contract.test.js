// R3-7 prerequisite: unrelated API edits must preserve stored photo data.
import { startApi } from '../../src/data/functions/testing/apiHarness.js';
let api;
beforeAll(async () => { api = await startApi(); });
afterAll(async () => { if (api) await api.stop(); });
it('preserves full photo objects on an unrelated REST update', async () => {
  await api.reset();
  const { token } = await api.makeToken('photo-test@example.invalid');
  const images = [{ url: 'data:image/png;base64,SYNTHETIC', caption: 'Pie', width: 600, height: 400 }];
  const created = await api.call('POST', '/recipes', { token, body: { title: 'Photo test', images } });
  expect(created.status).toBe(200);
  const edited = await api.call('PATCH', `/recipes/${created.json._id}`, { token, body: { title: 'Still has a photo' } });
  expect(edited.status).toBe(200);
  expect((await api.stored(created.json._id)).images).toEqual(images);
});
