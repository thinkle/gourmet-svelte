import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { flushSync, mount, unmount } from 'svelte';

vi.mock('../stores/userStore.js', async () => {
  const { writable } = await import('svelte/store');
  return { user: writable(null) };
});
vi.mock('../auth/session.js', () => ({ getToken: vi.fn() }));
vi.mock('../data/recipeData.js', () => ({ default: { updateRecipe: vi.fn(), addRecipe: vi.fn() } }));
vi.mock('./library.svelte.js', () => ({ library: { status: 'ready', syncing: false,
  recipes: [{ id: 7, _id: 'soup', title: 'Soup', ingredients: [{ text: 'milk', shopItem: 'milk' }] }] } }));

import ShoppingList from '../screens/shopping/ShoppingList.svelte';
import { shopping, live } from './shopping.svelte.js';

let component;
beforeEach(() => {
  // jsdom has the dialog element but does not implement its native close method.
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  shopping.rec = { ingredients: [{ id: 1, text: 'Soup', reference: 'soup', amount: { amount: 1, unit: 'recipe' } }], cart: [] };
  shopping.error = null;
  Object.assign(live, { enabled: false, status: 'off', pending: 0, error: null, notice: null });
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(async () => {
  if (component) await unmount(component);
  component = null;
  document.body.innerHTML = '';
  live.enabled = false;
  delete HTMLDialogElement.prototype.close;
  vi.unstubAllGlobals();
});
function show(onopen = vi.fn()) {
  component = mount(ShoppingList, { target: document.body, props: { active: true, onopen } });
  flushSync();
  return onopen;
}

it('keeps live mode off and ordinary editing available without making requests', () => {
  show();
  expect(document.querySelector('[aria-label="Live shopping settings"]')).not.toBeNull();
  expect(document.querySelector('[aria-label="Add an item"]').disabled).toBe(false);
  expect(document.querySelector('[aria-label="Multiplier for Soup"]')).not.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
});

it('preserves recipe navigation while live mode pauses list editing', () => {
  live.enabled = true; live.status = 'paused';
  const onopen = show();
  expect(document.querySelector('[aria-label="Add an item"]').disabled).toBe(true);
  expect(document.querySelector('[aria-label="Multiplier for Soup"]')).toBeNull();
  document.querySelector('[aria-label="Open recipe Soup"]').click();
  expect(onopen).toHaveBeenCalledWith(expect.objectContaining({ id: 7, _id: 'soup' }));
  expect(shopping.rec.cart).toEqual([]);
  expect(fetch).not.toHaveBeenCalled();
});
