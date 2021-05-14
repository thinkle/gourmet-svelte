import { require } from "../../utils/requireParams";
import { jsonConcisify } from "../../utils/textUtils";
import {
  loadDB,
  DB,
  getLastResult,
  insertOne,
  insertMany,
  queryCollection,
  getOne,
  replaceOne,
  deleteOne,
} from "./mongoConnect";
import { prepRecRemote } from "../utils/validate";
import {
  addRecipeRequest,
  deleteRecipeRequest,
  mostRecentRequest,
  updateRecipeRequest,
  getRecipeRequest,
  getRecipesRequest,
} from "../requests/index.js";
import { updateRecipe } from "./updateRecipe";

export async function getMostRecent(user) {
  let response = await queryCollection(
    "recipes",
    { "owner.email": user.account }, // query
    {
      fields: ["last_modified"],
      sort: { last_modified: -1 },
      limit: 1,
    } // options
  );
  let result = response.result;
  console.log("getMostRecent Got result:", result);
  if (result) {
    return result[0].last_modified;
  } else {
    return 0;
  }
}
mostRecentRequest.setRequestHandler(getMostRecent);

export async function addRecipe(user, params) {
  let { recipe } = params;
  prepRecRemote(recipe, user);
  //console.log('Add recipe',recipe.title,JSON.stringify(recipe.owner))
  let result = await insertOne("recipes", recipe, recipe);
  return result;
}
addRecipeRequest.setRequestHandler(addRecipe);

updateRecipeRequest.setRequestHandler(updateRecipe);

export async function getRecipe(user, params) {
  let { _id } = params;
  let recipe = await getOne("recipes", { _id, "owner.email": user.account });
  if (recipe) {
    return recipe;
  } else {
    // try grabbing one not for user/???
    //let recipe = await getOne('recipes',{_id})
    //throw Error(`No recipe found for user ${user.account}, _id ${_id}: Found this though: ${recipe} -last result was ${getLastResult()}`);
    throw Error(
      `No recipe found for user ${
        user.account
      }, _id ${_id}. Last DB result was ${getLastResult()}`
    );
  }
}

getRecipeRequest.setRequestHandler(getRecipe);

export async function getRecipes(user, params) {
  let { page, query, fields, limit } = params;
  // Enforce user only searches own recipes!
  if (!query) {
    query = {};
  }
  if (query["owner.email"]) {
    console.log("Warning: we had another email query???");
    console.log("Quashing it: it was", query);
  }
  query["owner.email"] = user.account;
  if (!limit) {
    limit = 100;
    if (fields && !fields.contains("text") && !fields.contains("ingredients")) {
      limit = 1000;
    }
  }
  if (!query["deleted"]) {
    query.deleted = { $ne: 1 }; // null or 0 or false
  }
  //console.log('getRecipes got ',page,query,fields,limit)
  let result = await queryCollection("recipes", query, {
    fields,
    limit,
    page,
    sort: { last_modified: -1 },
  });
  return result;
}

getRecipesRequest.setRequestHandler(getRecipes);

export async function deleteRecipe(user, params) {
  require(["_id"], params);
  const { _id } = params;
  let count = await deleteOne("recipes", {
    _id: _id,
    "owner.email": user.account,
  });
  if (count >= 1) {
    return count;
  } else {
    throw Error(
      `No recipe found to delete. Request ${jsonConcisify(
        params
      )}. Result: ${getLastResult()}`
    );
  }
}
deleteRecipeRequest.setRequestHandler(deleteRecipe);
