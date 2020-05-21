/**
dexieApi.js implements the interface for storing recipes in IndexDB

**/

import {prepRecLocal} from '../data/validate.js';
import Dexie from 'dexie';


const dexieApi = {
    async connect () {
        dexieApi.db = new Dexie('Recipes');
        dexieApi.db.version(1)
            .stores({
                recipes:'++id,&_id,*words,*ings'
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

    async getRecipes({query,fields,limit,page}={}) {
        let q = dexieApi.db.recipes
        if (query) {
            if (query.fulltext) {
                q = q.where('words').startsWith(
                    query.fulltext.toLowerCase()
                ); // fix for multiple words...
            }
        }
        if (page) {q = q.offset(page)}
        if (limit) {q = q.limit(limit)}
        let result = await q.toArray();
        return {
            result,
            page : result.length + page,
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
