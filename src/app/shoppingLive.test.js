import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('../stores/userStore.js', async () => {
  const { writable } = await import('svelte/store');
  return { user: writable(null) };
});
vi.mock('../auth/session.js', () => ({ getToken: vi.fn(async () => 'test-jwt') }));
vi.mock('../data/recipeData.js', () => ({ default: { updateRecipe: vi.fn(), addRecipe: vi.fn() } }));

import { user } from '../stores/userStore.js';
import local from '../data/local/dexieApi.js';
import recipeData from '../data/recipeData.js';
import { shopping, live, loadShopping, toggleLiveShopping, setLiveShoppingVisible, setCart, addItem } from './shopping.svelte.js';

let rec;
beforeEach(async () => {
  if (!local.db) await local.connect();
  await local.db.recipes.clear();
  const email = `shop-${crypto.randomUUID()}@example.test`;
  user.set({ email, remoteUser: { dbUser: {} } });
  rec = { _id: 'test-list', title: 'Shopping List', isShoppingList: 1, deleted: 0, savedRemote: 1,
    ingredients: [{ id: 1, text: 'milk' }], images: ['cached-image'], cart: [] };
  await local.updateServerRecipe(structuredClone(rec));
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ recipe: {
    ...rec, images: undefined, liveShopping: { tripId: 'trip-a', revision: 0, seen: {} },
  } }) })));
  await loadShopping();
  setLiveShoppingVisible(false);
  vi.clearAllMocks();
});
afterEach(() => { user.set(null); vi.unstubAllGlobals(); });

it('keeps default shopping free of live network requests', async () => {
  await loadShopping();
  setLiveShoppingVisible(true); setLiveShoppingVisible(false);
  expect(fetch).not.toHaveBeenCalled();
  expect(live.enabled).toBe(false);
});
it('queues live checkmarks separately without dirtying the kept recipe cache', async () => {
  await toggleLiveShopping();
  expect(live.enabled).toBe(true);
  expect(fetch).toHaveBeenCalledTimes(1);
  await setCart('milk', true);
  expect(shopping.rec.cart).toEqual(['milk']);
  expect(live.pending).toBe(1);
  const cached = await local.getRecipe(undefined, { mongoId: rec._id });
  expect(cached.cart).toEqual([]);
  expect(cached.savedRemote).toBe(1);
  expect(cached.images).toEqual(['cached-image']);
  expect(recipeData.updateRecipe).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
});
it('blocks ordinary list edits while live mode is enabled', async () => {
  await toggleLiveShopping();
  await addItem('eggs');
  expect(shopping.error).toMatch(/Turn live mode off/);
  expect(recipeData.updateRecipe).not.toHaveBeenCalled();
});
it('refuses to join until ordinary offline edits have synced', async () => {
  const cached = await local.getRecipe(undefined, { mongoId: rec._id });
  await local.updateRecipe({ ...cached, savedRemote: 0 });
  await toggleLiveShopping();
  expect(live.enabled).toBe(false);
  expect(live.error).toMatch(/Save and sync/);
  expect(fetch).not.toHaveBeenCalled();
});
it('stops live mode on signout without sending queued changes under another identity', async () => {
  await toggleLiveShopping(); await setCart('milk', true);
  user.set(null);
  expect(get(user)).toBeNull();
  expect(live.enabled).toBe(false);
  expect(live.pending).toBe(0);
  expect(fetch).toHaveBeenCalledTimes(1);
});
