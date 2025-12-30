import {registerHandlerObject} from '../requests/remoteRequest.js'
import './recipeFunctions.js';
import './importRecipeFunction.js';
import './nutritionFunctions.js';
import './shareRecipeFunctions';
import './exportRecipeFunctions';
import './tokenFunctions.js';
const requestHandlers = {
}
registerHandlerObject(requestHandlers);

import {DB} from './mongoConnect.js';
import './setupDB.js';
import {getFakeUser} from './netlifyDevUserMock.js';
import {userCache,getUser} from './userFunctions.js';
import { addRecipe, getRecipe, getRecipes, deleteRecipe } from './recipeFunctions.js';
import { updateRecipe } from './updateRecipe.js';
import { getUserFromApiToken, touchApiToken } from './tokenFunctions.js';

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        body: JSON.stringify(body),
    };
}

function makeError(statusCode, message) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

function getApiTokenFromHeaders(headers = {}) {
    const headerKeys = Object.keys(headers);
    const lower = {};
    headerKeys.forEach((k) => {
        lower[k.toLowerCase()] = headers[k];
    });
    const apiKey = lower['x-api-key'];
    if (apiKey) {
        return apiKey.trim();
    }
    const auth = lower['authorization'];
    if (!auth) {
        return null;
    }
    const parts = auth.split(' ');
    if (parts.length === 1) {
        return parts[0].trim();
    }
    if (parts.length >= 2) {
        const scheme = parts[0].toLowerCase();
        const value = parts.slice(1).join(' ').trim();
        if (!value) {
            return null;
        }
        if (scheme === 'bearer') {
            return value;
        }
        if (scheme === 'basic') {
            try {
                const decoded = Buffer.from(value, 'base64').toString('utf8');
                if (decoded.includes(':')) {
                    return decoded.split(':').slice(1).join(':');
                }
                return decoded.trim();
            } catch (err) {
                return null;
            }
        }
        return value;
    }
    return null;
}

function getPathParts(event) {
    let path = event.path || event.rawPath || '';
    const functionPath = '/.netlify/functions/api';
    if (path.indexOf(functionPath) > -1) {
        path = path.slice(path.indexOf(functionPath) + functionPath.length);
    } else if (path.startsWith('/api')) {
        path = path.slice('/api'.length);
    }
    return path.split('/').filter(Boolean);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function ensureScope(user, scope) {
    if (!user) {
        throw makeError(401, 'Unauthorized');
    }
    if (user.isApiToken) {
        const scopes = user.scopes || [];
        if (scopes.indexOf(scope) === -1) {
            throw makeError(403, 'Insufficient scope');
        }
    }
}

function normalizeRecipeInput(rawRecipe = {}) {
    const recipe = { ...rawRecipe };
    if (Array.isArray(recipe.ingredients) && recipe.ingredients.length) {
        if (typeof recipe.ingredients[0] === 'string') {
            recipe.ingredients = recipe.ingredients.map((text) => ({ text }));
        }
    }
    if (Array.isArray(recipe.categories) && recipe.categories.length) {
        if (typeof recipe.categories[0] === 'string') {
            recipe.categories = recipe.categories.map((name) => ({ name }));
        }
    }
    if (Array.isArray(recipe.sources) && recipe.sources.length) {
        if (typeof recipe.sources[0] === 'string') {
            recipe.sources = recipe.sources.map((name) => ({ name }));
        }
    }
    if (recipe.instructions && !recipe.text) {
        if (Array.isArray(recipe.instructions)) {
            recipe.text = recipe.instructions.map((body, index) => ({
                header: index === 0 ? 'Instructions' : '',
                body,
            }));
        } else {
            recipe.text = [{ header: 'Instructions', body: recipe.instructions }];
        }
    }
    if (typeof recipe.text === 'string') {
        recipe.text = [{ header: 'Instructions', body: recipe.text }];
    }
    return recipe;
}

async function handleRecipeRestRequest(method, pathParts, user, jsonBody, query) {
    if (method === 'GET') {
        ensureScope(user, 'recipes:read');
        if (pathParts[1]) {
            return await getRecipe(user, { _id: pathParts[1] });
        }
        const params = {};
        const queryObject = {};
        if (query.search) {
            queryObject.fullText = new RegExp(escapeRegex(query.search), 'i');
        }
        if (query.category) {
            queryObject['categories.name'] = query.category;
        }
        if (Object.keys(queryObject).length) {
            params.query = queryObject;
        }
        if (query.limit) {
            params.limit = Number(query.limit);
        }
        if (query.page) {
            params.page = Number(query.page);
        }
        return await getRecipes(user, params);
    }
    if (method === 'POST') {
        ensureScope(user, 'recipes:write');
        const recipe = normalizeRecipeInput(jsonBody.recipe || jsonBody);
        return await addRecipe(user, { recipe });
    }
    if (method === 'PATCH' || method === 'PUT') {
        ensureScope(user, 'recipes:write');
        if (!pathParts[1]) {
            throw makeError(400, 'Missing recipe id');
        }
        const recipe = normalizeRecipeInput(jsonBody.recipe || jsonBody);
        recipe._id = pathParts[1];
        return await updateRecipe(user, { recipe, forceMerge: true });
    }
    if (method === 'DELETE') {
        ensureScope(user, 'recipes:write');
        if (!pathParts[1]) {
            throw makeError(400, 'Missing recipe id');
        }
        return await deleteRecipe(user, { _id: pathParts[1] });
    }
    throw makeError(405, 'Method not allowed');
}

const handler = async (event, context) => {
    console.log('Calling handler, we have cached users: ',userCache)
    let params = event.queryStringParameters || {};
    let jsonBody = {}
    if (event.body) {
        try {
            jsonBody = JSON.parse(event.body);
        }
        catch (err) {
            console.log(`ERROR PARSING "${event.body}"`);
            throw err;
        }
    }
    params = {...jsonBody,...params}
    const clientContext = context && context.clientContext || {};
    var {
        // this magic documented here:
        // https://www.gatsbyjs.org/blog/2018-12-17-turning-the-static-dynamic/#bonus-points-authenticated-lambda-functions-for-your-gatsby-app
        user, // actual user info you can use for your serverless functions
    } = clientContext
    if (!user && event.headers && event.headers.referer && event.headers.referer.indexOf('localhost')>-1) {
        try {
        user = JSON.parse(event.headers.localuser)
        user.extraApiStuff = 'fakey fake fake stuff'
        } catch (err) {
            console.log('no good - headers were',event.headers,'use default fake')
            user = getFakeUser();
        }
    }
    if (user && userCache[user.email]) {
        //console.log('Got cached user',user.email)
        user.dbUser = userCache[user.email]
        user.usedCached = true;
    } else if (user) {
        //console.log('!!!Fetch DB user',user)
        //console.log('getUser(',event,context,user,params,')')
        // Note: this just gets the user...
        await getUser(user);
        userCache[user.email] = user.dbUser;
    }
    if (user && user.dbUser) {
        user.account = user.dbUser.linked || user.email // keys to the kingdom...
    }
    let body, error
    const pathParts = getPathParts(event);
    if (pathParts[0] === 'recipes') {
        try {
            if (!user) {
                const rawToken = getApiTokenFromHeaders(event.headers);
                const tokenResult = await getUserFromApiToken(rawToken);
                if (tokenResult) {
                    user = tokenResult.user;
                    await touchApiToken(tokenResult.user.apiTokenId);
                }
            }
            const responseBody = await handleRecipeRestRequest(
                (event.httpMethod || 'GET').toUpperCase(),
                pathParts,
                user,
                jsonBody,
                params || {}
            );
            return jsonResponse(200, responseBody);
        } catch (err) {
            return jsonResponse(err.statusCode || 500, {
                error: err.message || err.toString(),
            });
        }
    }
    // new way
    if (requestHandlers[params.mode]) {
        let handler = requestHandlers[params.mode]
        try {
            body = await handler(user,params);
            //console.log('Got response',body);
        } catch (err) {
            error = err;
            //console.log('Got error',error);
        }
    } 
    if (body) {
        //console.log('Return response');
        return {
            statusCode:200,
            body:JSON.stringify(body||'No return value')
        }
    } else { // error
        if (!error) {
            error = 'Function had no return value';
        }
        return {
            statusCode:400,
            body:JSON.stringify({error: error.toString(),
                                 params : params,
                                 jsonRequst : jsonBody,
                                 user : user,
                                })
        }
    }
}

// A couple of utility functions
import {EchoRequest,ThrowErrorRequest} from '../requests/index.js';

EchoRequest.setRequestHandler((user,params) => {
    return {params,
            DB,
            user:user,
            }
    }
);

ThrowErrorRequest.setRequestHandler(
    ()=>{
        throw 'Big Error'
    }
);


exports.handler = handler;
