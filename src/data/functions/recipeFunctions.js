import {insertOne,insertMany,queryCollection,getOne,replaceOne,deleteOne} from './mongoConnect.js';
import {validateRec}  from '../validate.js';

export default {
    async addRecipe (event, context, user, params) {
        let {recipe} = params
        validateRec(recipe);
        recipe.user = user.email;
        let result = await insertOne('recipes',
                                     recipe);
        return result;
    },

    async updateRecipe (event,context,user,params) {
        let {recipe} = params;
        if (!recipe.user) {
            recipe.user = user.email;
        } else {
            if (recipe.user !== user.email) {
                throw Error(
                    `Attempted to update recipe you do not own: owner is ${recipe.user} but logged in user is ${user.email}`
                )
            }
        }
        let result = await replaceOne('recipes',
                                     {_id:recipe._id},
                                      recipe);
        
        return result;
    },

    async updateRecipes (event,context,user,params) {
        let {recipes} = params
    },
    
    async getRecipe (event,context,user,params) {
        let {_id} = params;
        let recipe = await getOne('recipes',{_id, user:user.email})
        if (recipe) {
            return recipe
        }
        else {
            throw Error('No recipe found');
        }
    },

    async getRecipes (event,context,user,params) {
        //console.log('getRecipes got params: ',JSON.stringify(params));
        let {page,query,fields,limit} = params;
        if (!limit) {
            limit = 100;
        }
        //console.log('getRecipes got ',page,query,fields,limit)
        let result = await queryCollection(
            'recipes',
            query,
            {fields, limit, page}
        );
        return result
    },

    async deleteRecipe (event, context, user, params) {
        let {recipe} = params
        return await deleteOne('recipes',{_id:recipe._id,user:user.email});
    }
}
