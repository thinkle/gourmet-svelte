// The image interface agents use: see what a recipe has, add a photo by link
// or inline, caption it, move it, remove it. Nothing here reaches the network:
// the fetching module is replaced, as it is in recipe-image-fetch's tests.
import { startApi } from '../../src/data/functions/testing/apiHarness.js';

// The real downloader has its own tests (recipe-image-fetch); here it stands
// in, so nothing in these tests reaches the network.
jest.mock('../lib/recipeImage.js', () => ({
  MAX_IMAGE_BYTES: 4 * 1024 * 1024,
  downloadImage: jest.fn(async (url) => {
    if (/fails/.test(url)) { throw new Error('That URL did not return a supported photo.'); }
    if (/huge/.test(url)) { return { type: 'image/jpeg', bytes: Buffer.alloc(3200000, 1) }; }
    return { type: 'image/jpeg', bytes: Buffer.from(`downloaded:${url}`) };
  }),
}));
const { downloadImage } = require('../lib/recipeImage.js');
const fetchedUrls = () => downloadImage.mock.calls.map(([url]) => url);

const tiny = (letter) => `data:image/png;base64,${Buffer.from(`pretend-png-${letter}`).toString('base64')}`;

let api;
beforeAll(async () => { api = await startApi(); });
afterAll(async () => { if (api) await api.stop(); });

async function recipeWith(token, body = {}) {
  const created = await api.call('POST', '/recipes', { token, body: { title: 'Pie', ...body } });
  expect(created.status).toBe(200);
  return created.json._id;
}

let token;
beforeEach(async () => {
  await api.reset();
  downloadImage.mockClear();
  ({ token } = await api.makeToken('images@example.invalid'));
});

describe('seeing what a recipe has', () => {
  it('counts images on a recipe but never sends the picture back', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a'), caption: 'Cooling' }] });
    const got = await api.call('GET', `/recipes/${id}`, { token });
    expect(got.json.imageCount).toBe(1);
    expect(got.json.images).toEqual([]);
    expect(got.raw).not.toContain('pretend-png');
  });

  it('counts them in summaries when asked, without reading the picture data', async () => {
    await recipeWith(token, { title: 'With a photo', images: [{ url: tiny('a') }, { url: tiny('b') }] });
    await recipeWith(token, { title: 'Without' });
    const plain = await api.call('POST', '/recipes/summary/query', { token, body: {} });
    // The summary's own field set is unchanged unless a client asks for more.
    expect(plain.json.result.every((r) => r.imageCount === undefined)).toBe(true);
    for (const list of [
      await api.call('POST', '/recipes/summary/query', { token, body: { include: 'imageCount' } }),
      await api.call('GET', '/recipes/summary', { token, query: { include: 'imageCount' } }),
    ]) {
      const byTitle = Object.fromEntries(list.json.result.map((r) => [r.title, r.imageCount]));
      expect(byTitle).toEqual({ 'With a photo': 2, Without: 0 });
      expect(list.raw).not.toContain('pretend-png');
    }
  });

  it('lists each image with its caption and size, and hands over one on request', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a'), caption: 'Cooling', width: 600 }] });
    const list = await api.call('GET', `/recipes/${id}/images`, { token });
    expect(list.status).toBe(200);
    expect(list.json.images).toEqual([
      { index: 0, caption: 'Cooling', contentType: 'image/png', bytes: expect.any(Number), width: 600 },
    ]);
    expect(list.raw).not.toContain('pretend-png');
    const one = await api.call('GET', `/recipes/${id}/images/0`, { token });
    expect(one.json.url).toBe(tiny('a'));
    const missing = await api.call('GET', `/recipes/${id}/images/3`, { token });
    expect(missing.status).toBe(404);
  });
});

describe('giving a recipe a photo', () => {
  it('fetches an https url and stores the bytes, not the link', async () => {
    const id = await recipeWith(token);
    const added = await api.call('POST', `/recipes/${id}/images`, {
      token, body: { url: 'https://example.invalid/pie.jpg', caption: 'From the web' },
    });
    expect(added.status).toBe(200);
    expect(fetchedUrls()).toEqual(['https://example.invalid/pie.jpg']);
    expect(added.json.images).toEqual([{ index: 0, caption: 'From the web', contentType: 'image/jpeg', bytes: expect.any(Number) }]);
    const stored = await api.stored(id);
    expect(stored.images[0].url.startsWith('data:image/jpeg;base64,')).toBe(true);
    expect(Buffer.from(stored.images[0].url.split(',')[1], 'base64').toString()).toContain('downloaded:https://example.invalid/pie.jpg');
  });

  it('takes a picture sent inline', async () => {
    const id = await recipeWith(token);
    const added = await api.call('POST', `/recipes/${id}/images`, { token, body: { dataUrl: tiny('a') } });
    expect(added.status).toBe(200);
    expect(fetchedUrls()).toEqual([]);
    expect((await api.stored(id)).images).toEqual([{ url: tiny('a') }]);
  });

  it('adds a photo while creating the recipe, in one call', async () => {
    const created = await api.call('POST', '/recipes', {
      token, body: { title: 'Tart', imageUrls: ['https://example.invalid/tart.jpg'] },
    });
    expect(created.status).toBe(200);
    expect(created.json.imageCount).toBe(1);
    expect(created.json.imageUrls).toBeUndefined();
    expect((await api.stored(created.json._id)).images).toHaveLength(1);
  });

  it('adds to a recipe\'s photos on an update instead of replacing them', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a') }] });
    const updated = await api.call('PATCH', `/recipes/${id}`, {
      token, body: { title: 'Pie, improved', imageUrls: ['https://example.invalid/second.jpg'] },
    });
    expect(updated.status).toBe(200);
    const stored = await api.stored(id);
    expect(stored.title).toBe('Pie, improved');
    expect(stored.images).toHaveLength(2);
    expect(stored.images[0].url).toBe(tiny('a'));
  });

  it('puts an image where it is asked to, so an agent can choose the main photo', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a') }, { url: tiny('b') }] });
    const added = await api.call('POST', `/recipes/${id}/images`, { token, body: { dataUrl: tiny('c'), index: 0 } });
    expect(added.json.images.map((i) => i.index)).toEqual([0, 1, 2]);
    expect((await api.stored(id)).images.map((i) => i.url)).toEqual([tiny('c'), tiny('a'), tiny('b')]);
  });

  it('writes nothing when a photo cannot be fetched', async () => {
    const id = await recipeWith(token, { title: 'Untouched' });
    const added = await api.call('POST', `/recipes/${id}/images`, { token, body: { url: 'https://example.invalid/fails.jpg' } });
    expect(added.status).toBe(400);
    expect(added.json.error).toMatch(/Could not fetch that photo/);
    expect((await api.stored(id)).images ?? []).toEqual([]);
    const failedCreate = await api.call('POST', '/recipes', { token, body: { title: 'No photo', imageUrls: ['https://example.invalid/fails.jpg'] } });
    expect(failedCreate.status).toBe(400);
    const all = await api.call('POST', '/recipes/query', { token, body: {} });
    expect(all.json.result.map((r) => r.title)).toEqual(['Untouched']);
  });

  it('refuses a photo too big for the app to save, and says what to do', async () => {
    const id = await recipeWith(token);
    const added = await api.call('POST', `/recipes/${id}/images`, { token, body: { url: 'https://example.invalid/huge.jpg' } });
    expect(added.status).toBe(413);
    expect(added.json.error).toMatch(/Resize it/);
    expect((await api.stored(id)).images ?? []).toEqual([]);
  });

  it('refuses nonsense instead of storing it', async () => {
    const id = await recipeWith(token);
    for (const body of [{}, { dataUrl: 'not-a-data-url' }, { url: 'https://x.invalid/a.jpg', dataUrl: tiny('a') }, { dataUrl: tiny('a'), caption: 5 }]) {
      const result = await api.call('POST', `/recipes/${id}/images`, { token, body });
      expect([400, 413]).toContain(result.status);
    }
    expect((await api.stored(id)).images ?? []).toEqual([]);
  });
});

describe('changing and removing photos', () => {
  it('re-captions one', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a'), caption: 'Old' }] });
    const patched = await api.call('PATCH', `/recipes/${id}/images/0`, { token, body: { caption: 'The finished pie' } });
    expect(patched.json.images[0].caption).toBe('The finished pie');
    expect((await api.stored(id)).images[0]).toEqual({ url: tiny('a'), caption: 'The finished pie' });
  });

  it('moves one to the front', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a') }, { url: tiny('b') }] });
    await api.call('PATCH', `/recipes/${id}/images/1`, { token, body: { index: 0 } });
    expect((await api.stored(id)).images.map((i) => i.url)).toEqual([tiny('b'), tiny('a')]);
  });

  it('removes one and leaves the rest of the recipe alone', async () => {
    const id = await recipeWith(token, { images: [{ url: tiny('a') }, { url: tiny('b') }], rating: 4 });
    const removed = await api.call('DELETE', `/recipes/${id}/images/0`, { token });
    expect(removed.json.imageCount).toBe(1);
    const stored = await api.stored(id);
    expect(stored.images.map((i) => i.url)).toEqual([tiny('b')]);
    expect(stored.title).toBe('Pie');
    expect(stored.rating).toBe(4);
  });
});

describe('who may do it', () => {
  it('needs the right scope and a recipe that exists', async () => {
    const readOnly = await api.makeToken('images@example.invalid', ['recipes:read']);
    const id = await recipeWith(token, { images: [{ url: tiny('a') }] });
    expect((await api.call('GET', `/recipes/${id}/images`, { token: readOnly.token })).status).toBe(200);
    expect((await api.call('POST', `/recipes/${id}/images`, { token: readOnly.token, body: { dataUrl: tiny('b') } })).status).toBe(403);
    expect((await api.call('GET', `/recipes/${id}/images`, {})).status).toBe(401);
    expect((await api.call('GET', '/recipes/no-such-recipe/images', { token })).status).toBe(404);
  });
});
