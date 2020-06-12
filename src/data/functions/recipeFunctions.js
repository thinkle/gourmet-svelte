import {require} from '../../utils/requireParams.js';
import {jsonConcisify} from '../../utils/textUtils.js';
import {getLastResult,insertOne,insertMany,queryCollection,getOne,replaceOne,deleteOne} from './mongoConnect.js';
import {prepRecRemote}  from '../validate.js';


export default {
    async addRecipe (event, context, user, params) {
        let {recipe} = params
        prepRecRemote(recipe,user);
        console.log('Add recipe',recipe.title,JSON.stringify(recipe.owner))
        let result = await insertOne('recipes',
                                 recipe,recipe);
        return result;
    },

    async updateRecipe (event,context,user,params) {
        require(['recipe._id'],params)
        let {recipe} = params;
        prepRecRemote(recipe,user);
        console.log('Replace recipe',recipe.title,JSON.stringify(recipe.owner))
        let result = await replaceOne('recipes',
                                      {_id:recipe._id,
                                       'owner.email':user.account},
                                      recipe);
        return result;
    },

    async updateRecipes (event,context,user,params) {
        let {recipes} = params
    },
    
    async getRecipe (event,context,user,params) {
        require(['_id'],params)
        let {_id} = params;
        if (!_id) {
            throw new Error(
                `getRecipe called without required parameter _id. Called with ${JSON.stringify(params)} instead.`
            );
        }
        let recipe = await getOne('recipes',{_id, 'owner.email':user.account})
        if (recipe) {
            return recipe
        }
        else {
            // try grabbing one not for user/???
            //let recipe = await getOne('recipes',{_id})
            //throw Error(`No recipe found for user ${user.account}, _id ${_id}: Found this though: ${recipe} -last result was ${getLastResult()}`);
            throw Error(`No recipe found for user ${user.account}, _id ${_id}. Last DB result was ${getLastResult()}`);
        }
    },

    async getRecipes (event,context,user,params) {
        //console.log('getRecipes got params: ',JSON.stringify(params));
        let {page,query,fields,limit} = params;
        // Enforce user only searches own recipes!
        if (!query) {
            query = {}
        }
        if (query['owner.email']) {
                console.log('Warning: we had another email query???');
                console.log('Quashing it: it was',query);
        }
        query['owner.email'] = user.account;
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
        require(['_id'],params)
        const {_id} = params
        let count = await deleteOne('recipes',{_id:_id,'owner.email':user.account});
        if (count >= 1) {
            return count;
        }
        else {
            throw Error(
                `No recipe found to delete. Request ${jsonConcisify(params)}. Result: ${getLastResult()}`
            )
        }
    }
}
