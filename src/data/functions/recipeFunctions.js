import {insertOne,insertMany,queryCollection,getOne,updateOne} from './mongoConnect.js';
import {validateRec}  from '../validate.js';

export default {
    async addRecipe (event, context, user, params) {
        let {recipe} = params
        let result = await insertOne('recipes',
                                     recipe);
        return result;
    },

    async updateRecipe (event,context,user,params) {
        let {recipe} = params;
        let result = await updateOne('recipes',
                                     {_id:recipe._id},
                                     recipe);
        return result;        
    },

    async updateRecipes (event,context,user,params) {
        let {recipes} = params
    },
    
    async getRecipe (event,context,user,params) {
        let {recid} = params;
    },

    async getRecipes (event,context,user,params) {
        console.log('getRecipes got params: ',JSON.stringify(params));
        let {page,query,fields,limit} = params;
        if (!limit) {
            limit = 100;
        }
        console.log('getRecipes got ',page,query,fields,limit)
        let result = await queryCollection(
            'recipes',
            query,
            {fields, limit, page}
        );
        return result
    },

    async deleteRecipe (event, context, user, params) {
        let {recipe} = params
    }
}
