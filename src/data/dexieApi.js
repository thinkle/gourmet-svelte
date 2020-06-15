/**
dexieApi.js implements the interface for storing recipes in IndexDB

**/

import {prepRecLocal} from '../data/validate.js';
import Dexie from 'dexie';
import stopword from 'stopword'

const dexieApi = {
    async connect () {
        dexieApi.db = new Dexie('Recipes');
        dexieApi.db.version(4)
            .stores({
                recipes:'++id,&_id,*words,*ings,isShoppingList,deleted'
            });
        return true;
    },

    addRecipe (recipe) {
        return dexieApi.db.recipes.add(
            prepRecLocal(recipe)
        );
    },

    getRecipe (recid, {mongoId}={}) {
        if (mongoId) {
            return dexieApi.db.recipes.get(
                {_id:mongoId}
            );
        }
        else {
            return dexieApi.db.recipes.get({id:recid})
        }
    },

    searchWord (word, {deleted}={}) {
        let q = dexieApi.db.recipes
        q = q.where('words').startsWith(
            word.toLowerCase()
        ); 
        if (deleted!==undefined) {
            q = q.and((o)=>o.deleted==deleted);
        }
        return q
    },

    async searchWords (words, {deleted}={}) {
        words = stopword.removeStopwords(words);
        console.log('searchWords',words);
        let q = dexieApi.db.recipes
        var ids = undefined;
        for (let word of words) {
            let subResults = dexieApi.searchWord(word,{deleted});
            let subIds = await subResults.primaryKeys()
            if (!ids) {
                ids = subIds;
            } else {
                ids = ids.filter(
                    (id)=>subIds.indexOf(id)>-1
                );
                if (ids.length == 0) {
                    return undefined
                }
            }
        }
        q = q.where(':id').anyOf(ids);
        q.alreadyCounted = ids.length;
        return q;
    },

    async getRecipes({query,fields,limit,page}={}) {
        let q = dexieApi.db.recipes
        if (query && query.isShoppingList) {
            q = dexieApi.db.recipes.where('isShoppingList').equals(1)
        } else if (query && query.fulltext) {
            // Note: we split words by \W when we full-text index
            query.fulltext = query.fulltext.replace(/^\W+|\W+$/g,'')
            if (query.fulltext.indexOf(' ')>-1) {
                console.log('Query is: ',query.fulltext.split(/\W+/))
                q = await dexieApi.searchWords(
                    query.fulltext.split(/\W+/),
                    query // this object hands in deleted
                )
            }
            else {
                console.log('Query is: ',query.fulltext)
                q = dexieApi.searchWord(query.fulltext,query);
            }
        } else if (query && query.deleted !== undefined) {
            query.deleted = Number(query.deleted); // no booleans in dexie!
            q = dexieApi.db.recipes.where('deleted').equals(query.deleted);
        }
        if (!q) {
            return {
                result:[],
                count:0,
            }
        }
        let count
        if (q.alreadyCounted) {
            count = q.alreadyCounted
        } else {
            //else if (q.clone) {
            try {
                count = await q.clone().count()
            }
            //else {
            catch (err) {
                count = await q.count();
            }
        }
        if (page) {q = q.offset(page)}
        if (limit) {q = q.limit(limit)}
        let result = await q.toArray();
        let previousPage = 0;
        if (page && result.length) {
            previousPage = page - (limit||result.length)
        }
        let last = (result.length + (page||0) >= count)
        return {
            result,
            count,
            prevPage : previousPage,
            nextPage : result.length + (page||0),
            currentPage : page||0,
            last
        }
        
    },

    async updateRecipe (recipe) {
        return await dexieApi.db.recipes.put(prepRecLocal(recipe))
    },
    async updateRecipes (recipes) {
        return await dexieApi.db.recipes
            .bulkPut(
                recipes.map(prepRecLocal)
            );
    },
    async deleteRecipe (id) {
        if (id.id) {
            id = id.id; // accept object too
        }
        return await dexieApi.db.recipes.delete(id);
    }
}

export default dexieApi;
