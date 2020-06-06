import 'regenerator-runtime/runtime'
import Dexie from 'dexie';
import indexedDB from 'fake-indexeddb';
import IDBKeyRange from"fake-indexeddb/lib/FDBKeyRange";
Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange
