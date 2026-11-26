import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createLiveShopping, projectLiveShopping } from './liveShopping.js';
import { liveShoppingStore } from './liveShoppingStorage.js';

const clone = (s) => s === undefined ? undefined : structuredClone(s);
const snapshot = () => ({ _id: 'list', ingredients: [], cart: [], trip: [],
  liveShopping: { tripId: 'trip-1', revision: 0 } });
function memoryStore() {
  let state;
  return { read: async () => clone(state), update: async (edit) => { state = clone(edit(clone(state))); return clone(state); } };
}
function setup(options = {}) {
  let server = snapshot();
  let visible = true;
  let shown;
  const request = vi.fn(async (action) => {
    if (action) {
      if (action.type === 'done') server = { ...server, cart: [], trip: [], liveShopping: { tripId: 'trip-2', revision: server.liveShopping.revision + 1 } };
      else {
        server.cart = action.on ? [...new Set([...server.cart, action.key])] : server.cart.filter((k) => k !== action.key);
        server.liveShopping.revision++;
      }
    }
    return { recipe: clone(server), staleTrip: false };
  });
  const store = options.store || memoryStore();
  const onSnapshot = vi.fn(async () => {});
  const engine = createLiveShopping({ store, request, onSnapshot,
    onChange: (s) => { shown = s; }, canPoll: () => visible, ...options });
  return { engine, store, request, onSnapshot, view: () => shown, visible: (v) => { visible = v; engine.wake(); } };
}
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());
const tick = () => vi.advanceTimersByTimeAsync(1);

describe('opt-in live shopping', () => {
  it('makes no requests and schedules no polling when off, including after restore', async () => {
    const s = setup();
    await s.engine.restore(); s.engine.wake();
    await vi.advanceTimersByTimeAsync(60000);
    expect(s.request).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    expect(s.view().enabled).toBe(false);
  });
  it('polls every five seconds only while visible and enabled', async () => {
    const s = setup(); await s.engine.enable();
    expect(s.request).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(4999);
    expect(s.request).toHaveBeenCalledTimes(1);
    await tick(); expect(s.request).toHaveBeenCalledTimes(2);
    s.visible(false); await vi.advanceTimersByTimeAsync(60000);
    expect(s.request).toHaveBeenCalledTimes(2);
    expect(vi.getTimerCount()).toBe(0);
    s.visible(true); await tick(); expect(s.request).toHaveBeenCalledTimes(3);
    await s.engine.disable(); await vi.advanceTimersByTimeAsync(60000);
    expect(s.request).toHaveBeenCalledTimes(3);
  });
  it('saves checks locally before any request, restores them after reload, then uploads', async () => {
    const store = liveShoppingStore(`offline-${crypto.randomUUID()}`);
    const a = setup({ store }); await a.engine.enable(); a.visible(false);
    await a.engine.enqueue('cart', 'milk', true);
    expect(a.view().recipe.cart).toEqual(['milk']);
    expect(a.request).toHaveBeenCalledTimes(1);
    a.engine.dispose();
    const b = setup({ store }); b.visible(false); await b.engine.restore();
    expect(b.view().pending).toBe(1);
    expect(b.view().recipe.cart).toEqual(['milk']);
    expect(b.request).not.toHaveBeenCalled();
    b.visible(true); await tick();
    await vi.waitFor(() => expect(b.request).toHaveBeenCalledTimes(1));
    expect(b.request.mock.calls[0][0]).toMatchObject({ key: 'milk', type: 'cart', seq: 1, tripId: 'trip-1' });
    await vi.waitFor(() => expect(b.view().pending).toBe(0));
    expect(b.view().recipe.cart).toEqual(['milk']);
    b.engine.dispose();
  });
  it('preserves both queued actions when two tabs share the persistent store', async () => {
    const store = liveShoppingStore(`tabs-${crypto.randomUUID()}`);
    const a = setup({ store }); await a.engine.enable(); a.visible(false);
    const b = setup({ store }); b.visible(false); await b.engine.restore();
    await Promise.all([a.engine.enqueue('cart', 'milk', true), b.engine.enqueue('cart', 'eggs', true)]);
    const saved = await store.read();
    expect(saved.pending.map((x) => x.key).sort()).toEqual(['eggs', 'milk']);
    expect(new Set(saved.pending.map((x) => x.seq)).size).toBe(2);
    a.engine.dispose(); b.engine.dispose();
  });
  it('does not overwrite a local check with a poll that was already in flight', async () => {
    const s = setup(); await s.engine.enable();
    let resolvePoll;
    s.request.mockImplementationOnce(() => new Promise((resolve) => { resolvePoll = resolve; }));
    await vi.advanceTimersByTimeAsync(5000);
    await s.engine.enqueue('cart', 'milk', true);
    resolvePoll({ recipe: snapshot(), staleTrip: false });
    await tick();
    expect(s.view().recipe.cart).toEqual(['milk']);
    await tick();
    expect(s.view().pending).toBe(0);
    s.engine.dispose();
  });
  it('backs off failed requests, retains the outbox, and pauses retries after auth failure', async () => {
    const s = setup(); await s.engine.enable();
    s.request.mockRejectedValue(new Error('Offline'));
    await s.engine.enqueue('cart', 'milk', true); await tick();
    expect(s.view().pending).toBe(1);
    const calls = s.request.mock.calls.length;
    await vi.advanceTimersByTimeAsync(9998); expect(s.request).toHaveBeenCalledTimes(calls);
    await tick(); expect(s.request).toHaveBeenCalledTimes(calls + 1);
    s.request.mockRejectedValue(Object.assign(new Error('Sign in again'), { status: 401 }));
    await vi.advanceTimersByTimeAsync(20000);
    const paused = s.request.mock.calls.length;
    await vi.advanceTimersByTimeAsync(120000);
    expect(s.request).toHaveBeenCalledTimes(paused);
    expect(s.view().pending).toBe(1);
    expect(s.view().status).toBe('attention');
    s.engine.dispose();
  });
  it('retains live mode when offline pending changes prevent turning it off', async () => {
    const s = setup(); await s.engine.enable(); s.visible(false);
    await s.engine.enqueue('cart', 'milk', true);
    await expect(s.engine.disable()).rejects.toThrow(/pending changes/);
    expect(s.view().enabled).toBe(true);
    expect(s.view().pending).toBe(1);
    s.engine.dispose();
  });
  it('ends a trip offline and stops polling after acknowledgement', async () => {
    const s = setup(); await s.engine.enable(); s.visible(false);
    await s.engine.enqueue('done');
    await expect(s.engine.enqueue('cart', 'milk', true)).rejects.toThrow(/end of this trip/);
    expect(s.view().recipe.cart).toEqual([]);
    s.visible(true); await tick();
    expect(s.view().enabled).toBe(false);
    expect(s.view().pending).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('discards stale offline changes visibly when another shopper ends the trip', async () => {
    const s = setup(); await s.engine.enable(); s.visible(false);
    await s.engine.enqueue('cart', 'milk', true);
    await s.engine.enqueue('cart', 'eggs', true);
    s.request.mockResolvedValue({ recipe: { ...snapshot(), liveShopping: { tripId: 'new-trip', revision: 2 } }, staleTrip: true });
    s.visible(true); await tick();
    expect(s.view().pending).toBe(0);
    expect(s.onSnapshot).toHaveBeenLastCalledWith(expect.objectContaining({ cart: [] }));
    expect(s.view().notice).toMatch(/trip ended/);
    expect(s.view().enabled).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    s.engine.dispose();
  });
  it('stops polling on the other phone when it observes Done shopping', async () => {
    const s = setup(); await s.engine.enable();
    s.request.mockResolvedValue({ recipe: { ...snapshot(), liveShopping: { tripId: 'new-trip', revision: 1 } }, staleTrip: false });
    await vi.advanceTimersByTimeAsync(5000);
    expect(s.view().enabled).toBe(false);
    expect(s.view().notice).toMatch(/other shopper ended/);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('ignores late responses after switching accounts or disposing the controller', async () => {
    const s = setup(); await s.engine.enable();
    let resolve;
    s.request.mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    await vi.advanceTimersByTimeAsync(5000);
    s.onSnapshot.mockClear(); s.engine.dispose();
    resolve({ recipe: snapshot() }); await tick();
    expect(s.onSnapshot).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('never applies old-trip actions to a new-trip snapshot', () => {
    expect(projectLiveShopping(snapshot(), [{ type: 'cart', tripId: 'old-trip', key: 'milk', on: true }]).cart).toEqual([]);
  });
});
