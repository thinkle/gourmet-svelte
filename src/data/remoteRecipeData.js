/**
*  remoteApi.js implements remote storage/fetching of recipes through
*  calls to our lambda functions served from the backend.
**/

import querystring from 'querystring'
import {addRecipeRequest,
        getRecipeRequest,
        getRecipesRequest,
        importRecipesRequest,
        exportRecipesRequest,
        updateRecipeRequest,
        setRecipeSharingRequest,
        getSharedRecipeRequest,
    } from './requests/index.js';

function RecipeData (user) {
    
    const api = {
        async connect () {
            // eventually we should probably check if the user is logged in
            // and can access the MongoDB or something...
            if (user && user.remoteUser && user.remoteUser.dbUser) {
                return true;
            }
        },
        addRecipe (recipe) {   
            if (recipe.alternatives) {
                delete recipe.alternatives;
            }
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
        async exportRecipes (params) {
            let response = await exportRecipesRequest.makeRequest(
                {user,params}
            )
            let result = response.result
            while (result.length < response.count) {
                response = await exportRecipesRequest.makeRequest(
                    {
                        user,
                        params:{
                            ...params,
                            page:result.length,
                        }
                    }
                );
                if (!response.result.length) {
                    // we must be done?
                    return result;
                } else {
                result = [...result,...response.result];
                }
            }
            return result;
        },
        importRecipes (params) {
            return importRecipesRequest.makeRequest(
                {user,params}
            );
        },
        setRecipeSharing (params) {
            console.log('setRecipeSharing',params)
            return setRecipeSharingRequest.makeRequest(
                {user,params}
            );
        },
        getSharedRecipe (params) {
            return getSharedRecipeRequest.makeRequest(
                {user,params}
            )
        }
    }

    return api;

}

export {RecipeData}
export {RecipeData as RemoteRecipeData}
export default {RecipeData}
