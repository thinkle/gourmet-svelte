import {importRecipesRequest} from '../requests/index.js';
import {prepRecsRemote} from '../utils/validate.js'
import {insertMany} from './mongoConnect.js';

importRecipesRequest.setRequestHandler(importRecipes);

async function importRecipes (user, params) {
    let collection = params;
    prepRecsRemote(collection,user);
    let importedRecipes = await insertMany('recipes',collection.recipes);
    return importedRecipes;
}
export default 'loaded';