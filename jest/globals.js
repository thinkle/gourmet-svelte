console.log('Loading globals')
import Dexie from 'dexie';
import indexedDB from 'fake-indexeddb';
import IDBKeyRange from"fake-indexeddb/lib/FDBKeyRange";
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange
console.log('Dexie has dependencies:',Dexie.dependencies);
