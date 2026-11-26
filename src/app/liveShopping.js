// Offline outbox and polling lifecycle. No Svelte, auth or recipe-sync dependencies.
// The store's update must be transactional, so two tabs cannot overwrite pending actions.
export function projectLiveShopping(snapshot, pending) {
  if (!snapshot) return null;
  const rec = structuredClone(snapshot);
  for (const action of pending) {
    if (action.tripId !== snapshot.liveShopping.tripId) continue;
    if (action.type === 'done') { rec.cart = []; rec.trip = []; }
    else if (action.on) rec.cart = [...new Set([...(rec.cart || []), action.key])];
    else rec.cart = (rec.cart || []).filter((k) => k !== action.key);
  }
  return rec;
}

export function createLiveShopping({ store, request, onChange, onSnapshot = async () => {},
  canPoll = () => true, uuid = () => crypto.randomUUID(),
  schedule = setTimeout, cancel = clearTimeout, interval = 5000 }) {
  let state = null;
  let busy = false;
  let disposed = false;
  let timer;
  let authPaused = false;
  let failures = 0;
  let error = null;
  let status = 'off';
  let localQueue = Promise.resolve();

  const notify = () => {
    if (disposed) return;
    onChange({ enabled: !!state?.enabled, pending: state?.pending?.length || 0,
      recipe: state?.enabled ? projectLiveShopping(state.snapshot, state.pending) : null,
      notice: state?.notice || null, error, status });
  };
  const clearTimer = () => { if (timer !== undefined) cancel(timer); timer = undefined; };
  const allowed = () => !disposed && state?.enabled && !authPaused && canPoll();
  function wake(delay = 0) {
    clearTimer();
    if (!allowed()) {
      status = state?.enabled ? (authPaused ? 'attention' : 'paused') : 'off';
      notify();
      return;
    }
    if (!busy) timer = schedule(() => { timer = undefined; void sync(); }, delay);
  }
  function mutate(fn) {
    const run = async () => {
      state = await store.update((previous) => {
        const next = previous || { enabled: false, snapshot: null, pending: [], clientId: uuid(), nextSeq: 1 };
        fn(next);
        return next;
      });
      notify();
    };
    const result = localQueue.then(run, run);
    localQueue = result.catch(() => {});
    return result;
  }
  async function sync() {
    if (!allowed() || busy) return;
    busy = true;
    status = 'syncing'; notify();
    let again = interval;
    try {
      await localQueue;
      state = await store.read(); // another tab may have queued or acknowledged actions
      if (!allowed()) return;
      const action = state.pending[0];
      const reply = await request(action);
      if (disposed) return;
      let tripEnded = !!reply.staleTrip;
      await mutate((s) => {
        const priorTrip = s.snapshot?.liveShopping.tripId;
        if (action) s.pending = s.pending.filter((a) => a.clientId !== action.clientId || a.seq !== action.seq);
        if (!s.snapshot || reply.recipe.liveShopping.revision >= s.snapshot.liveShopping.revision) {
          s.snapshot = reply.recipe;
        }
        tripEnded ||= !!priorTrip && priorTrip !== s.snapshot.liveShopping.tripId;
        const oldCount = s.pending.length;
        s.pending = s.pending.filter((a) => a.tripId === s.snapshot.liveShopping.tripId);
        if (reply.staleTrip || s.pending.length !== oldCount) {
          s.notice = 'This trip ended. Live mode is off. Changes from the old trip were not applied.';
        } else if (tripEnded && action?.type !== 'done') {
          s.notice = 'The other shopper ended this trip. Live mode is off.';
        }
        // Keep the stop decision durable if updating the ordinary recipe cache fails.
        if (tripEnded || action?.type === 'done') s.tripEnded = true;
      });
      if (disposed) return;
      await onSnapshot(state.snapshot);
      // Both phones stop polling once each has received the confirmed trip boundary.
      if (state.tripEnded && !state.pending.length) await mutate((s) => { s.enabled = false; s.tripEnded = false; });
      failures = 0; error = null;
      status = state.enabled ? 'synced' : 'off';
      again = state.pending.length ? 0 : interval;
    } catch (err) {
      if (disposed) return;
      error = err.message || 'Could not sync. Changes are saved on this phone.';
      authPaused = err.status === 401 || err.status === 403 || err.status === 404;
      failures += 1;
      status = authPaused ? 'attention' : 'offline';
      again = Math.min(60000, interval * 2 ** Math.min(failures, 4));
    } finally {
      busy = false;
      if (!disposed) { notify(); if (allowed()) wake(again); }
    }
  }
  return {
    async restore() { state = await store.read(); status = state?.enabled ? 'paused' : 'off'; notify(); },
    async enable() {
      if (state?.enabled) { authPaused = false; error = null; wake(); return; }
      status = 'joining'; notify();
      try {
        const reply = await request(); // explicit opt-in, never called by restore
        if (disposed) return;
        await onSnapshot(reply.recipe);
        await mutate((s) => { s.enabled = true; s.snapshot = reply.recipe; s.notice = null; s.tripEnded = false; });
        error = null; status = 'synced'; wake(interval); notify();
      } catch (err) {
        error = err.message; status = 'off'; notify(); throw err;
      }
    },
    async enqueue(type, key, on) {
      await mutate((s) => {
        if (!s.enabled || !s.snapshot) throw new Error('Enable live shopping first.');
        if (s.pending.some((a) => a.type === 'done')) throw new Error('Finish syncing the end of this trip first.');
        s.pending.push({ type, ...(type === 'cart' ? { key, on } : {}),
          tripId: s.snapshot.liveShopping.tripId, clientId: s.clientId, seq: s.nextSeq++ });
      });
      wake();
    },
    async disable() {
      await localQueue;
      state = await store.read();
      if (busy || state?.pending.length) throw new Error('Let pending changes sync before turning live mode off. You can leave this screen while offline.');
      if (state?.snapshot) await onSnapshot(state.snapshot);
      await mutate((s) => {
        // A checkbox may have been queued while the cache write above was in flight.
        if (busy || s.pending.length) throw new Error('Let pending changes sync before turning live mode off. You can leave this screen while offline.');
        s.enabled = false;
      });
      error = null; status = 'off'; wake();
    },
    wake: () => wake(),
    retry() { authPaused = false; error = null; wake(); },
    dispose() { disposed = true; clearTimer(); },
  };
}
