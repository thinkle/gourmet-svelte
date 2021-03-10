// Our "glue" layer between local data and remote data.
// This layer will handle syncing of data between remote and local storage

import localRecipeData from "./local/dexieApi.js";
import { RecipeData as RemoteRecipeData } from "./remoteRecipeData.js";
import { user } from "../stores/userStore.js";
import status from "../stores/statusStore.js";
import { prepRecLocal,isLocalID } from "./utils/validate.js";
import { jsonConcisify } from "../utils/textUtils.js";
import { writable, get } from "svelte/store";
import { getContext } from "svelte";
import { crawlForReferences } from "./utils/crawlForReferences";
let remoteRecipeData;

export const connectedRemote = writable(false);

const NO_DB = 0;
const NO_REMOTE = false;

user.subscribe((u) => {
  if (u && u.remoteUser && u.remoteUser.dbUser) {
    remoteRecipeData = RemoteRecipeData(u);
    connectedRemote.set(true);
  } else {
    if (user.remoteUser && !user.remoteUser.dbUser) {
      connectedRemote.set(NO_DB);
    } else {
      connectedRemote.set(NO_REMOTE);
    }
  }
});

async function checkForReferences(recipe) {
  if (!get(connectedRemote)) {
    console.log("Not connected = don't bother trying to get remote IDs");
  }
  let references = crawlForReferences(recipe.ingredients);
  for (let ing of references) {
    if (isLocalID(ing.reference)) {
      let targetRec = await localRecipeData.getRecipe(ing.reference);
      if (targetRec._id) {
        ing.reference = targetRec._id;
        ing.referenceExists = true;
      } else {
        targetRec = await recipeData.updateRecipe(targetRec, false); // don't update timestamp
        if (targetRec._id) {
          ing.reference = targetRec._id;
          ing.referenceExists = true;
        } else {
          console.log(
            "Unable to save linked recipe remotely - maybe we're syncing several new recipes at once?"
          );
          console.log(ing.reference, ing);
        }
      }
    } else {
      let targetRec = await localRecipeData.getRecipe(undefined, { mongoId: ing.reference });
      if (targetRec) {

        ing.referenceExists = true;
      } else {
        console.log(
          "WARNING: linked recipe appears to not exist???",
          ing.reference,
          recipe
        );
      }
    }
  }
}

const recipeData = {
  ...localRecipeData,

  // Simple ones...
  async setRecipeSharing () {
    let updated = await remoteRecipeData.setRecipeSharing(...arguments);
    localRecipeData.updateRecipe(updated);
    return updated;
  },
  async getSharedRecipe () {
    return await remoteRecipeData.getSharedRecipe(...arguments)
  },
  // And everything else is more complicated...
  // we typically have to touch both remote and
  // local and handle failure of remote connection
  // appropriately...
  
  connectRemote: () => remoteRecipeData && true,

  async addRecipe(recipe) {
    recipe.last_modified = new Date().getTime();
    let recid = await localRecipeData.addRecipe(recipe);
    recipe.id = recid;
    await checkForReferences(recipe);
    try {
      let remoteRec = await remoteRecipeData.addRecipe(recipe);
      remoteRec.savedRemote = true;
      recipe.savedRemote = true; // update the object we were handed in case it sticks around...
      await localRecipeData.updateRecipe(remoteRec);
      return remoteRec;
    } catch (err) {
      console.log("Error saving remotely", err.toString());
      console.log(err);
    }
    return recipe;
  },
  // This is for "patching" -- current use case is just for shopping lists where we likely
  // have changed the recipe on the backend and our "edits" usually just mean we're adding
  // something.
  async addToRecipe(changes) {
    await checkForReferences(changes);
    let updatedRec;
    try {
      updatedRec = await remoteRecipeData.addToRecipe(changes);
      updatedRec.savedRemote = true;
      await localRecipeData.updateRecipe(updatedRec);
    } catch (err) {
      updatedRec = localRecipeData.addToRecipe(changes); // only works for simple adding ingredients to list
    }
    return updatedRec;
  },
  async updateRecipe(recipe, updateTimestamp = true) {
    let origRec = recipe;
    if (updateTimestamp) {
      recipe.last_modified = new Date().getTime();
    }
    await checkForReferences(recipe);
    if (recipe._id) {
      try {
        recipe = await remoteRecipeData.updateRecipe(recipe);
        recipe.savedRemote = 1;
        //recipe._id = remoteRec._id;
        if (recipe.merged) {
          console.log("Damn, we merged");
          console.log("Original", origRec);
          console.log("Merged:", recipe);
        }
      } catch (err) {
        recipe.savedRemote = 0;
        console.log("Error updating remote recipe:", recipe, err);
        // Update status?
      }
    } else {
      try {
        recipe = await remoteRecipeData.addRecipe(recipe);
        recipe.savedRemote = 1;
      } catch (err) {
        console.log("Error adding remote recipe", recipe, err);
      }
    }
    await localRecipeData.updateRecipe(recipe);
    return recipe;
  },
  async deleteRecipe(id) {
    let recipe = await recipeData.getRecipe(id);
    recipe.deleted = true;
    this.updateRecipe(recipe);
  },
  async updateRecipes(recipes) {
    recipes.map(this.updateRecipe); // lazy & bad -- fixme if we actually implement features that use this
  },

  async importRecipes(json) {
    let batches = batchRecipes(json);
    console.log("Split into ", batches.length, "batches");
    while (batches) {
      let json = batches.pop();
      console.log("Processing batch...", json);
      let recipes = await remoteRecipeData.importRecipes(json); // push to remote DB...
      await this.updateRecipes(recipes); // lazy lazy... - now push to local DB
    }
    return;
  },

  async sync(test = false, { onPartialSync }) {
    if (!localRecipeData.db) {
      await localRecipeData.connect();
    }
    let unsynced = await localRecipeData.getRecipes({ query: { savedRemote: 0 } });
    if (unsynced.count) {
      let uploadStatus = status.createStatus("Syncing recipes to database");
      status.start(uploadStatus);
      // should do a bulk put in the future...
      let count = 0;
      for (let rec of unsynced.result) {
        await recipeData.updateRecipe(rec, false);
        count += 1;
        status.progress(uploadStatus, {
          name: "Uploading recipes",
          amount: count,
          total: unsynced.count,
        });
      }
      status.progress(uploadStatus, { name: "Upload done" });
    }

    let statusId = status.createStatus("Syncing Recipes from database...", {
      type: "recipe",
    });

    let keepFetchingIDs = true;
    let idPage = 0;
    let result = [];

    while (keepFetchingIDs) {
      status.start(statusId);
      let remoteResponse = await remoteRecipeData.getRecipes({
        limit: 1000,
        fields: ["_ID", "id", "last_modified", "owner"],
        page: idPage,
      });
      let remoteRecs = remoteResponse.result;
      status.progress(statusId, {
        name: "Fetching recipes from server",
        amount: remoteResponse.page,
        total: remoteResponse.count,
      });
      let recsToFetch = [];
      for (let remoteRec of remoteRecs) {
        // What if we have remote but no local?
        //if (!remoteRec.id) { return true }
        // otherwise... fetch it (this is probably inefficient
        // and stupid, but let's just move forward for now...)
        let localCopy = await localRecipeData.getRecipe(undefined, {
          mongoId: remoteRec._id,
        });
        if (localCopy && localCopy.last_modified < remoteRec.last_modified) {
          recsToFetch.push(remoteRec);
        } else if (!localCopy) {
          recsToFetch.push(remoteRec);
        }
      }
      let keepGoing = true;
      let page = 0;
      while (keepGoing && recsToFetch.length > 0) {
        status.progress(statusId, {
          name: "Fetching more recent data from server...",
          amount: remoteResponse.page + page,
          total: remoteResponse.count + page,
        });
        let fullRecResponse = await remoteRecipeData.getRecipes({
          query: { _id: { $in: recsToFetch.map((r) => r._id) } },
          limit: 50,
          page,
        });
        fullRecResponse.result.forEach((r) => (r.savedRemote = 1)); // mark all as saved :)
        await localRecipeData.updateRecipes(fullRecResponse.result);
        if (onPartialSync) {
          onPartialSync(fullRecResponse.result);
        }
        if (test) {
          status.complete(statusId, { name: "Exiting early - testing mode!" });
          return;
        }
        result.push(fullRecResponse.result);
        page = fullRecResponse.page;
        if (page < fullRecResponse.count) {
          keepGoing = true;
        } else {
          keepGoing = false;
        }
      }
      keepFetchingIDs = remoteResponse.page < remoteResponse.count;
      idPage = remoteResponse.page;
    }
    status.complete(statusId, {
      name: `Done syncing recipes: fetched ${result.length} updated items.`,
      amount: result.length,
      total: result.length,
    });
    return { recs: result };
  },
};

function batchRecipes(json) {
  // One import must be split up...
  const batchSize = 50;
  let currentBatch = 0;
  let batches = [];
  while (json.recipes.length > currentBatch * batchSize) {
    let batch = {
      ...json,
      recipes: json.recipes.slice(
        currentBatch * batchSize,
        (currentBatch + 1) * batchSize
      ),
    };
    batches.push(batch);
    currentBatch += 1;
  }
  return batches;
}

export default recipeData;
