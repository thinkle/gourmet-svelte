// see : https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
const VERSION = 8
if (!window.indexedDB) {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
}
if (!window.indexedDB) {
    console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
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

function DB () {
    return new Promise((resolve,reject)=>{
        var request = window.indexedDB.open('Recipes',VERSION)
        var db;
        request.onerror = (err) => {
            console.log('Why was I not allowed to open a DB?',err);
            reject(err)
        }
        request.onupgradeneeded = api._initialize
        request.onsuccess = (event) => {
            console.log('Loaded DB')
            db = event.currentTarget.result;
            resolve(db);
        }
    })
}

const api = {
    async connect () {
        this.db = await DB();
        return this.db;
    },
    async _initialize (event) {
        const db = event.target.result
        console.log('_initializing DB');
        await P(db.createObjectStore('recipes',
                                     {keyPath:'id', autoIncrement:true})
               );
    },
    
    async _getRecStore () {
        this.transaction = this.db.transaction(['recipes'],'readwrite');
        this.recStore = this.transaction.objectStore('recipes');
    },

    async addRecipe (recipe, user) {
        await api._getRecStore();
        return P(api.recStore.add(recipe));
    },
    async getRecipe (recid, user) {
        await api._getRecStore();
        return P(api.recStore.get(recid))
    },
    async getRecipes (page,user) {
        await api._getRecStore();
        if (!page) {
            let result = await P(api.recStore.getAll(undefined,100))
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
    async updateRecipe (recipe,user) {
        await api._getRecStore();
        return P(api.recStore.put(recipe));
    },
    async updateRecipes (recipes,user) {
        let results = [];
        for (let r of recipes) {
            results.push(await api.updateRecipe(r,user));
        }
        return results;
    },

    async deleteRecipe (id, user) {
        console.log('deleteRecipe',id)
        await api._getRecStore();
        return P(api.recStore.delete(id))
    }
}

export default api 
    
