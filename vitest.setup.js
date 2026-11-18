// IndexedDB for the kept Dexie cache, in memory. Tests never reach a server:
// with no signed-in user the kept data layer has no remote to call.
import "fake-indexeddb/auto";
