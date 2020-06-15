import {require} from '../../utils/requireParams.js';
import {jsonConcisify} from '../../utils/textUtils.js';
import {getLastResult,insertOne,insertMany,queryCollection,getOne,replaceOne,deleteOne} from './mongoConnect.js';
import {prepRecRemote}  from '../validate.js';
import {mostRecentRequest,
       addRecipeRequest} from '../requests/index.js';

export async function getMostRecent (user) {
    let response = await queryCollection(
        'recipes',
        {'owner.email':user.account}, // query
        {
            fields : ['last_modified'],
            sort:{last_modified:-1},
            limit:1
        } // options
    );
    let result = response.result
    console.log('getMostRecent Got result:',result);
    if (result) {
        return result[0].last_modified
    } else {
        return 0
    }
}
mostRecentRequest.setRequestHandler(getMostRecent);


export async function addRecipe (user, params) {
    let {recipe} = params
    prepRecRemote(recipe,user);
    //console.log('Add recipe',recipe.title,JSON.stringify(recipe.owner))
    let result = await insertOne('recipes',
                                 recipe,recipe);
    return result;
}
addRecipeRequest.setRequestHandler(addRecipe);

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
            {fields, limit, page,
            sort:{last_modified:-1},
            }
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
