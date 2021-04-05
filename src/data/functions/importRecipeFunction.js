import { importRecipesRequest } from "../requests/index";
import { prepRecsRemote } from "../utils/validate";
import { insertMany } from "./mongoConnect";

importRecipesRequest.setRequestHandler(importRecipes);

async function importRecipes(user, params) {
  let collection = params;
  prepRecsRemote(collection, user, true);
  let importedRecipes = await insertMany("recipes", collection.recipes);
  return importedRecipes;
}
