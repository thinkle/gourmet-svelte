/**
*  remoteApi.js implements remote storage/fetching of recipes through
*  calls to our lambda functions served from the backend.
**/

import querystring from 'querystring'
import {addRecipeRequest,
        getRecipeRequest,
        getRecipesRequest,
        importRecipesRequest,
        updateRecipeRequest} from './requests/index.js';

function RecipeApi (user) {
    
    const api = {
        async connect () {
            // eventually we should probably check if the user is logged in
            // and can access the MongoDB or something...
            if (user && user.remoteUser && user.remoteUser.dbUser) {
                return true;
            }
        },
        addRecipe (recipe) {
            return addRecipeRequest.makeRequest(
                {user,params:{recipe}}
            );
        },
        addToRecipe (recipe) {
            return updateRecipeRequest.makeRequest(
                {user,params:{recipe,forceMerge:true}}
            );
        },
        updateRecipe (recipe) {
            // Note: remote will insert if it's not already there (upsert: true)
            return updateRecipeRequest.makeRequest(
                {user,params:{recipe}}
            );
        },
        getRecipe (_id) {
            return getRecipeRequest.makeRequest(
                {user,
                 params:{_id}}
            );
        },
        getRecipes ({query,fields,limit,page}={}) {
            let params = {query,fields,limit,page};
            return getRecipesRequest.makeRequest(
                {user,params}
            );
        },
        importRecipes (params) {
            return importRecipesRequest.makeRequest(
                {user,params}
            );
        },
        
    }

    return api;

}

export {RecipeApi}

export default {RecipeApi}
