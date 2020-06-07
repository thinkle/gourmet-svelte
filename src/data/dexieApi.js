/**
dexieApi.js implements the interface for storing recipes in IndexDB

**/

import {prepRecLocal} from '../data/validate.js';
import Dexie from 'dexie';


const dexieApi = {
    async connect () {
        dexieApi.db = new Dexie('Recipes');
        dexieApi.db.version(2)
            .stores({
                recipes:'++id,&_id,*words,*ings,*isShoppingList'
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

    searchWord (word) {
        let q = dexieApi.db.recipes
        q = q.where('words').startsWith(
            word.toLowerCase()
        ); // fix for multiple words...        
        return q
    },

    async searchWords (words) {
        let q = dexieApi.db.recipes
        var ids = undefined;
        for (let word of words) {
            let subResults = dexieApi.searchWord(word);
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
        }
        if (query && query.fulltext) {
            if (query.fulltext.indexOf(' ')>-1) {
                query.fulltext = query.fulltext.replace(/^\s+|\s+$/g,'')
                q = await dexieApi.searchWords(
                    query.fulltext.split(/\s+/)
                )                
            }
            else {
                q = dexieApi.searchWord(query.fulltext);
            }
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
        }
        //else if (q.clone) {
        try {
            count = await q.clone().count()
        }
        //else {
        catch (err) {
            count = await q.count();
        }
        if (page) {q = q.offset(page)}
        if (limit) {q = q.limit(limit)}
        let result = await q.toArray();
        let previousPage = 0;
        if (page && result.length) {
            previousPage = page - result.length
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
