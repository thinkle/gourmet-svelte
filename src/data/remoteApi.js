/**
*  remoteApi.js implements remote storage/fetching of recipes through
*  calls to our lambda functions served from the backend.
**/

import querystring from 'querystring'
import {addRecipeRequest,
        getRecipeRequest,
        getRecipesRequest,
        updateRecipeRequest} from './requests/index.js';
const baseURL = "/.netlify/functions/api?"

//mode=echo&message=howdy"
function requestURI (mode,params) {
    return baseURL + querystring.stringify(
        {mode:mode,
         ...params}
    )
}
const u = requestURI // shorthand

async function doFetch (mode, user, params) {
    //console.log('sending request',mode,params)
    let result = await fetch(u(mode),{
        method : 'post',
        headers : {
            Accept : 'application/json',
            'Content-Type':'application/json',
            Authorization : 'Bearer ' + (user && user.access_token || '')
        },
        body : JSON.stringify(params)
    }
                            );
    if (result.status==200) {
        return await result.json(); // return the promise from text...
    } else if (result.status==400) {
        let e = await result.json()
         throw e;
    }
    else {
        let e = Error('Error fetching');
        e.status = result.status;
        e.url = u(mode,params)
        e.error = await result.json();
        throw e.error;
    }
}


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
            // return doFetch(
            //     'addRecipe',
            //     user,
            //     {recipe}
            // );
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
            // return doFetch(
            //     'updateRecipe',
            //     user,
            //     {recipe}
            // );
            //console.log('Update got result',result);
            //return result;
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

        deleteRecipe (_id) {
            return doFetch(
                'trashRecipe',
                user,
                {_id}
            );
        }
    }

    return api;

}
export {doFetch}
export {RecipeApi}


export default {doFetch,RecipeApi}
