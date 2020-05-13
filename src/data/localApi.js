// see : https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
import {prepRecLocal} from '../data/validate.js';


const VERSION = 23
if (!window.indexedDB) {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
}

function incrementChar (c) {
    return String.fromCharCode(c.charCodeAt(0) + 1);
}

function incrementWord (word) {
    let start = word.substr(0,word.length-1);
    let end = word.substr(word.length-1)
    return start + incrementChar(end);
}

function getWordBound (word) {
    return IDBKeyRange.bound(word,incrementWord(word))
}

// Promise wrapper 
function P (response) {
    return new Promise((resolve,reject)=>{
        response.onsuccess = ()=>{
            //console.log('Success!',response);
            return resolve(response.result);
        }
        response.onerror = (e)=>reject(e);
    }
                      );
}

function getAllFromIndex (index, keyrange, limit) {
    let results = [];
    let ids = [];
    return new Promise((resolve,reject)=>{
        index.openCursor(keyrange).onsuccess = function (event) {
            var cursor = event.target.result;
            if(cursor) {
                if (ids.indexOf(cursor.value.id)==-1) {
                    results.push(cursor.value);
                    ids.push(cursor.value.id);
                }
                if (!limit || results.length < limit) {
                    cursor.continue();
                }
                else {
                    resolve(results)
                }
            }
            else {
                resolve(results)
            }
        }
        
    });
}


const api = {
    connect () {
        return new Promise((resolve,reject)=>{
            api.request = window.indexedDB.open('Recipes',VERSION)
            api.request.onerror = (err) => {
                console.log('Why was I not allowed to open a DB?',err);
                reject(err)
            }
            api.request.onupgradeneeded = api._initialize
            api.request.onsuccess = (event) => {
                console.log('Loaded DB')
                api.db = event.currentTarget.result;
                resolve(api.db);
            }
        });
    },
    async _initialize (event) {
        api.db = event.target.result
        console.log('run _initialize');
        console.log('_initializing DB');
        let recStore
        try {
            recStore = api.db.createObjectStore('recipes',
                                                    {keyPath:'id', autoIncrement:true})
        }
        catch (err) {
            console.log('Unable to create recipes store - maybe already exists?');
            console.log(err);
            recStore = api.request.transaction.objectStore('recipes');
        }
        console.log('Creating indexes on ',recStore);
        recStore
            .createIndex('mongoid','_id',{unique:true});
        console.log('mongo index');
        recStore
            .createIndex('category','categories',{multiEntry:true});
        console.log('cat index');
        recStore
            .createIndex('words','words',{multiEntry:true});
        console.log('word index');
        recStore
            .createIndex('ings','ings',{multiEntry:true});
        console.log('ing index');
        console.log('Created indexes');
    },
    
    async _getRecStore () {
        api.transaction = api.db.transaction(['recipes'],'readwrite');
        api.recStore = api.transaction.objectStore('recipes');
    },

    async addRecipe (recipe) {
        await api._getRecStore();
        return P(api.recStore.add(recipe));
    },
    async getRecipe (recid, {mongoId}={}) {
        if (mongoId) {
            await api._getRecStore();
            return P(api.recStore.index('mongoid').get(mongoId))
        }
        else {
            await api._getRecStore();
            return P(api.recStore.get(recid))
        }
    },

    async getRecipes ({query, fields, limit=undefined, page}={}) {
        console.log('!!!local getRecipes call');
        await api._getRecStore();
        if (query&&query.fulltext) {
            let result = await getAllFromIndex(
                api.recStore.index('words'),
                getWordBound(query.fulltext),
            );
            console.log('Returning ',result.length,'recipes')
            return {
                result
            }
        }

        if (!page) {
            let result = await P(api.recStore.getAll(undefined,limit))
            let count = await P(api.recStore.count());
            if (result.length < count) {
                // fix me
                return {
                    result,
                    nextPage : 'oops',
                }
            }
            else {
                return {
                    result,
                    nextPage : undefined,
                }
            }
        }
    },
    async updateRecipe (recipe) {
        await api._getRecStore();        
        return P(api.recStore.put(prepRecLocal(recipe)));
    },
    async updateRecipes (recipes) {
        let results = [];
        recipes.forEach(
                (r)=>{if (!r.id) {r.id = r._id}}
            );
        for (let r of recipes) {
            results.push(await api.updateRecipe(r));
        }
        return results;
    },

    async deleteRecipe (id) {
        console.log('deleteRecipe',id)
        await api._getRecStore();
        return P(api.recStore.delete(id))
    }
}

export default api 
    
