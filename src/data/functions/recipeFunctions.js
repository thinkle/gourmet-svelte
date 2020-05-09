import {insertOne,insertMany,queryCollection,getOne,updateOne} from './mongoConnect.js';
import {validateRec}  from '../validate.js';

export default {
    async addRecipe (event, context, user, params) {
        let {recipe} = params
    },

    async updateRecipe (event,context,user,params) {
        let {recipe} = params
    },

    async updateRecipes (event,context,user,params) {
        let {recipe} = params;
        
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
            {fields, limit}
        );
        let nextPage;        
        return {
            result,
            nextPage
        }
    },

    async deleteRecipe (event, context, user, params) {
        let {recipe} = params
    }
}
