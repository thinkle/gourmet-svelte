import Dexie from 'dexie';

// Separate from Recipes: pending live actions must never be uploaded as full recipe saves.
let db;
function database() {
  if (!db) {
    db = new Dexie('GourmetLiveShopping');
    db.version(1).stores({ sessions: '&scope' });
  }
  return db;
}
export function liveShoppingStore(scope) {
  const d = database();
  return {
    read: () => d.sessions.get(scope),
    update: (edit) => d.transaction('rw', d.sessions, async () => {
      const next = edit(await d.sessions.get(scope));
      next.scope = scope;
      await d.sessions.put(next);
      return next;
    }),
  };
}
