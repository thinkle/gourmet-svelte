import { registerHandlerObject } from '../requests/remoteRequest.js'
import './recipeFunctions.js';
import './importRecipeFunction.js';
import './nutritionFunctions.js';
import './shareRecipeFunctions';
import './exportRecipeFunctions';
import './tokenFunctions.js';
const requestHandlers = {
}
registerHandlerObject(requestHandlers);

import { DB } from './mongoConnect.js';
import './setupDB.js';
import { getFakeUser } from './netlifyDevUserMock.js';
import { userCache, getUser } from './userFunctions.js';
import { addRecipe, getRecipe, getRecipes, deleteRecipe } from './recipeFunctions.js';
import { updateRecipe } from './updateRecipe.js';
import { getUserFromApiToken, touchApiToken } from './tokenFunctions.js';
import { normalizeIngredients } from '../../utils/ingredientParsing.js';

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
        console.log('Used api key header', apiKey.slice(0, 4) + '...')
        return apiKey.trim();
    }
    const auth = lower['authorization'];
    if (!auth) {
        console.log('No authorization header');
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
            console.log('No authorization value');
            return null;
        }
        if (scheme === 'bearer') {
            console.log('Used bearer token', value.slice(0, 4) + '...');
            return value;
        }
        if (scheme === 'basic') {
            console.log('Used basic auth token', value.slice(0, 4) + '...');
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

function getAuthDebugInfo(headers = {}) {
    const headerKeys = Object.keys(headers);
    const lower = {};
    headerKeys.forEach((k) => {
        lower[k.toLowerCase()] = headers[k];
    });
    const apiKey = lower['x-api-key'];
    const auth = lower['authorization'];
    let scheme = null;
    let tokenLength = 0;
    if (auth && typeof auth === 'string') {
        const parts = auth.trim().split(' ');
        if (parts.length > 1) {
            scheme = parts[0].toLowerCase();
            tokenLength = parts.slice(1).join(' ').trim().length;
        } else {
            tokenLength = parts[0].trim().length;
        }
    } else if (apiKey && typeof apiKey === 'string') {
        scheme = 'x-api-key';
        tokenLength = apiKey.trim().length;
    }
    return {
        hasAuthorization: Boolean(auth),
        hasApiKey: Boolean(apiKey),
        scheme,
        tokenLength,
    };
}

function stripImagesFromRecipe(recipe) {
    if (!recipe || typeof recipe !== 'object') {
        return recipe;
    }
    if (Array.isArray(recipe.images)) {
        recipe.images = [];
    } else if (recipe.images) {
        delete recipe.images;
    }
    return recipe;
}

function stripImagesFromResponse(payload) {
    if (!payload || typeof payload !== 'object') {
        return payload;
    }
    if (Array.isArray(payload)) {
        payload.forEach(stripImagesFromRecipe);
        return payload;
    }
    if (Array.isArray(payload.result)) {
        payload.result.forEach(stripImagesFromRecipe);
        return payload;
    }
    return stripImagesFromRecipe(payload);
}

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRecipeListParams(query) {
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
    return params;
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
    if (recipe.ingredients) {
        // Ingredients may arrive as plain text, as {amount, unit, ingredient},
        // as groups with nested lists, or already canonical. Whatever we get,
        // parse it here so the stored recipe always has structured amounts --
        // API clients don't run the browser-side parser the editor uses.
        recipe.ingredients = normalizeIngredients(recipe.ingredients);
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

/**
   What we tell API/MCP clients about the shapes we want. Served from
   /recipes/schema so a client can ask instead of guessing.
**/
const RECIPE_SHAPE = {
    ingredients: {
        preferred: {
            amount: 'number, or a string like "1 1/2" or "2-3" (optional)',
            unit: 'string, e.g. "cups", "tbsp", "cloves" (optional)',
            ingredient: 'the ingredient name and any prep, e.g. "flour, sifted"',
        },
        alsoAccepted: [
            'a plain string like "1 1/2 cups flour, sifted" -- the server parses ' +
            'the amount and unit out of it for you',
            '{text, amount: {amount, rangeAmount, unit}} -- the canonical stored shape',
            '{text, ingredients: [...]} -- a group heading with its own sub-list',
        ],
        stored: {
            text: 'the ingredient name only, with the amount and unit removed',
            amount: {
                amount: 'number; the upper bound when the ingredient is a range',
                rangeAmount: 'number; the lower bound of a range (omitted otherwise)',
                unit: 'the unit as written',
                standardUnit: 'our normalized unit, when we recognize it',
            },
        },
        note: 'Send amount/unit/ingredient separately when you know them. If you ' +
            'only have a line of text, send the text and we will parse it.',
    },
    categories: 'array of strings, or [{name}]',
    sources: 'array of strings, or [{name, url}]',
    instructions: 'a string (plain text or HTML), or an array of strings',
    yields: '[{amount, unit}]',
    times: '[{name, seconds, text}]',
    rating: 'number, 0-5',
    updateSemantics:
        'Updates are partial at the field level: fields you omit keep their stored ' +
        'value. Fields you send replace what is stored -- sending `ingredients` ' +
        'replaces the entire ingredient list, it is not merged with the old one. ' +
        'To add one ingredient, read the recipe first and send the full new list.',
};

/**
   Apply a partial update to a stored recipe.

   "Partial" means field-level: fields you don't mention keep their stored
   value. Fields you *do* mention are replaced outright -- in particular,
   sending `ingredients` or `categories` replaces the whole list rather than
   unioning it with what's already there, which is what the docs promise and
   what you need in order to delete an ingredient.
**/
async function applyRecipeUpdate(user, recipeId, rawUpdate) {
    let existing;
    try {
        existing = await getRecipe(user, { _id: recipeId });
    } catch (err) {
        throw makeError(404, `No recipe found with id ${recipeId}`);
    }
    const update = normalizeRecipeInput(rawUpdate);
    delete update._id;
    delete update.owner;
    delete update.last_remote_save;
    const recipe = { ...existing, ...update, _id: recipeId };
    return await updateRecipe(user, { recipe, replace: true });
}

async function handleRecipeRestRequest(method, pathParts, user, jsonBody, query) {
    if (pathParts[1] === 'schema') {
        ensureScope(user, 'recipes:read');
        return RECIPE_SHAPE;
    }
    if (method === 'GET') {
        ensureScope(user, 'recipes:read');
        if (pathParts[1] === 'summary') {
            const params = buildRecipeListParams(query);
            params.fields = [
                '_id',
                'title',
                'rating',
                'last_modified',
                'categories',
                'yields',
                'times',
                'owner',
            ];
            return await getRecipes(user, params);
        }
        if (pathParts[1]) {
            return await getRecipe(user, { _id: pathParts[1] });
        }
        return await getRecipes(user, buildRecipeListParams(query));
    }
    if (method === 'POST' && pathParts[1] === 'query') {
        ensureScope(user, 'recipes:read');
        const params = buildRecipeListParams(jsonBody || {});
        return await getRecipes(user, params);
    }
    if (method === 'POST' && pathParts[1] === 'summary' && pathParts[2] === 'query') {
        ensureScope(user, 'recipes:read');
        const params = buildRecipeListParams(jsonBody || {});
        params.fields = [
            '_id',
            'title',
            'rating',
            'last_modified',
            'categories',
            'yields',
            'times',
            'owner',
        ];
        return await getRecipes(user, params);
    }
    if (method === 'POST' && pathParts[1] === 'get') {
        ensureScope(user, 'recipes:read');
        const recipeId = jsonBody && (jsonBody.id || jsonBody._id);
        if (!recipeId) {
            throw makeError(400, 'Missing recipe id');
        }
        return await getRecipe(user, { _id: recipeId });
    }
    if (method === 'POST' && pathParts[1] === 'update') {
        ensureScope(user, 'recipes:write');
        const recipeId = jsonBody && (jsonBody.id || jsonBody._id || (jsonBody.recipe && jsonBody.recipe._id));
        if (!recipeId) {
            throw makeError(400, 'Missing recipe id');
        }
        const rawUpdate = { ...(jsonBody.recipe || jsonBody) };
        delete rawUpdate.id;
        return await applyRecipeUpdate(user, recipeId, rawUpdate);
    }
    if (method === 'POST' && pathParts[1] === 'delete') {
        ensureScope(user, 'recipes:write');
        const recipeId = jsonBody && (jsonBody.id || jsonBody._id);
        if (!recipeId) {
            throw makeError(400, 'Missing recipe id');
        }
        return await deleteRecipe(user, { _id: recipeId });
    }
    if (method === 'POST') {
        ensureScope(user, 'recipes:write');
        if (pathParts[1]) {
            throw makeError(405, 'Method not allowed');
        }
        const recipe = normalizeRecipeInput(jsonBody.recipe || jsonBody);
        return await addRecipe(user, { recipe });
    }
    if (method === 'PATCH' || method === 'PUT') {
        ensureScope(user, 'recipes:write');
        if (!pathParts[1]) {
            throw makeError(400, 'Missing recipe id');
        }
        return await applyRecipeUpdate(user, pathParts[1], jsonBody.recipe || jsonBody);
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
    console.log('Calling handler, we have cached users: ', userCache)
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
    params = { ...jsonBody, ...params }
    const clientContext = context && context.clientContext || {};
    var {
        // this magic documented here:
        // https://www.gatsbyjs.org/blog/2018-12-17-turning-the-static-dynamic/#bonus-points-authenticated-lambda-functions-for-your-gatsby-app
        user, // actual user info you can use for your serverless functions
    } = clientContext
    if (!user && event.headers && event.headers.referer && event.headers.referer.indexOf('localhost') > -1) {
        try {
            user = JSON.parse(event.headers.localuser)
            user.extraApiStuff = 'fakey fake fake stuff'
        } catch (err) {
            console.log('no good - headers were', event.headers, 'use default fake')
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
        console.log('Recipes request', {
            method: (event.httpMethod || 'GET').toUpperCase(),
            path: event.path || event.rawPath || '',
            query: event.queryStringParameters || {},
        });
    }
    if (pathParts[0] === 'authcheck') {
        return jsonResponse(200, {
            auth: getAuthDebugInfo(event.headers || {}),
        });
    }
    if (pathParts[0] === 'recipes') {
        try {
            if (!user) {
                const rawToken = getApiTokenFromHeaders(event.headers);
                const tokenResult = await getUserFromApiToken(rawToken);
                if (tokenResult) {
                    console.log('Authenticated API token for user', tokenResult.user.email);
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
            return jsonResponse(200, stripImagesFromResponse(responseBody));
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
            body = await handler(user, params);
            //console.log('Got response',body);
        } catch (err) {
            error = err;
            //console.log('Got error',error);
        }
    }
    if (body) {
        //console.log('Return response');
        return {
            statusCode: 200,
            body: JSON.stringify(body || 'No return value')
        }
    } else { // error
        if (!error) {
            error = 'Function had no return value';
        }
        console.log('Return error', error);
        return {
            statusCode: 400,
            body: JSON.stringify({
                error: error.toString(),
                params: params,
                jsonRequst: jsonBody,
                user: user,
            })
        }
    }
}

// A couple of utility functions
import { EchoRequest, ThrowErrorRequest } from '../requests/index.js';

EchoRequest.setRequestHandler((user, params) => {
    return {
        params,
        DB,
        user: user,
    }
}
);

ThrowErrorRequest.setRequestHandler(
    () => {
        throw 'Big Error'
    }
);


exports.handler = handler;
