import { readable, writable, get, derived } from "svelte/store";
import { tick } from "svelte";
import recipeData from "../data/recipeData.js";
export { connectedRemote } from "../data/recipeData.js";
import deepcopy from "deepcopy";
import { diffRecs } from "../data/utils/diff.js";
import { isLocalID } from "../data/utils/validate.js";
const stored = writable({});

const activePage = writable([]);
export const pageInfo = writable({});
const actionState = writable({}); // for e.g. "searching recipes..."
const individualActionState = writable({}); // for e.g. updating recipe #123124

export const connected = readable(false, (set) => {
  recipeData
    .connect()
    .then(() => {
      set(true);
    })
    .catch((err) => {
      console.log("Error connecting:", err);
    });
});

function setStoreProp(store, p, v) {
  // set store prop to value...
  store.update((d) => {
    d[p] = v;
    return d;
  });
}

function setStoredRec(rec) {
  stored.update((data) => {
    data[rec.id] = {
      // We're keeping old data in case we've e.g. fetched new
      // summary info from the DB for a list display but we already
      // have full info fetched from another api call and we don't
      // want to remove all that data for e.g. noting whether a
      // recipe has saved of not.
      //
      // I may regret this :)
      ...data[rec.id],
      ...deepcopy(rec),
    };
    if (rec._id) {
      data[rec._id] = rec;
    }
    return data;
  });
}

function setStoredRecs(recs) {
  stored.update((data) => {
    recs.forEach((rec) => {
      // possibly keep old data in case new data is partial
      data[rec.id] = { ...data[rec.id], ...deepcopy(rec) };
      if (rec._id) {
        data[rec._id] = data[rec.id];
      }
    });
    return data;
  });
}

export const storedRecipes = {
  subscribe: stored.subscribe,
  /**
   * @param  {number} id localId
   * @param  {string} mongoId mongoId
   * @returns recipe
   */
  get: async function (id, mongoId) {
    let $stored = get(stored);
    if ($stored[id]) {
      return $stored[id];
    } else if ($stored[mongoId]) {
      return $stored[mongoId];
    } else {
      let result = await recipeActions.getRecipe(id, mongoId);
      return result;
    }
  },
};

export const recipePage = {
  subscribe: activePage.subscribe,
};

// Debug
// stored.subscribe(
//     (v)=>console.log('Stored updated:',Object.keys(v))
// )
// local.subscribe(
//     (v)=>console.log('Local updated:',Object.keys(v))
// )

export const recipeActions = {
  async doSync({ testing = false, onPartialSync, onSync } = {}) {
    await recipeData.sync(testing, { onPartialSync });
    if (onSync) {
      onSync();
    } //await recipeActions.getRecipes({limit:50});
  },

  async createRecipe(r) {
    if (!r) {
      r = {};
    }
    setStoreProp(actionState, "creating", true);
    let recipe = await recipeData.addRecipe(r);
    setStoredRec(recipe);
    tick();
    localRecipes.open(recipe.id);
    setStoreProp(actionState, "creating", false);
    setStoreProp(actionState, "created", recipe.id);
    return recipe;
  },
  async getRecipe(id, mongoId) {
    setStoreProp(actionState, "loading", true);
    let response = await recipeData.getRecipe(id, { mongoId });
    if (response) {
      setStoredRec(response);
      setStoreProp(actionState, "loading", false);
    }
    return response;
  },

  async openRecipe(id) {
    let rec = await recipeActions.getRecipe(id);
    if (!rec) {
      rec = await recipeActions.getRecipe(undefined, id); // mongoID?
    }
    if (!rec) {
      console.log('No recipe?',id);
      return 
    }
    let localCopy = await localRecipes.open(rec.id);
    return localCopy;
  },

  async getInfiniteRecipes({ query, fields, limit = 15, sort } = {}) {
    setStoreProp(actionState, "querying", { query, fields, limit });
    let response = await recipeData.getRecipes({ query, fields, limit, sort });
    setStoredRecs(response.result);
    activePage.set([...new Set(response.result.map((r) => r.id))]);
    setStoreProp(actionState, "querying", false);
    return {
      count: response.count,
      done: response.last,
      async more() {
        setStoreProp(actionState, "querying", {
          query,
          fields,
          limit,
          sort,
          page: response.nextPage,
        });
        response = await recipeData.getRecipes({
          query,
          fields,
          limit,
          sort,
          page: response.nextPage,
        });
        setStoredRecs(response.result);
        activePage.update((page) => {
          page = [...new Set([...page, ...response.result.map((i) => i.id)])];
          return page;
        });
        setStoreProp(actionState, "querying", false);
        if (response.last) {
          this.done = true;
          // return true to indicate we are done!
          return true;
        }
      },
    };
  },

  async getRecipes({ query, fields, sort, limit, page } = {}) {
    setStoreProp(actionState, "querying", { query, fields, sort, limit, page });
    let response = await recipeData.getRecipes({ query, fields, sort, limit, page });
    setStoredRecs(response.result);
    activePage.set(response.result.map((r) => r.id));
    pageInfo.set({
      currentPage: response.currentPage,
      nextPage: response.nextPage,
      prevPage: response.prevPage,
      count: response.count,
      last: response.last,
    });
    setStoreProp(actionState, "querying", false);
  },

  async updateRecipe(recipe) {
    let updatedRecipe = await recipeData.updateRecipe(recipe);
    setStoredRec(updatedRecipe);
  },

  async revertRecipe(id) {
    let storedRecipe = await this.getRecipe(id); //get(stored)[id]
    setStoreProp(localRecipes, id, deepcopy(storedRecipe));
  },

  async deleteRecipe(id) {
    await recipeData.deleteRecipe(id);
    removeIdFromStores(id);
  },

  async permanentlyDeleteRecipe(id) {
    await recipeData.permanentlyDeleteRecipe(id);
    removeIdFromStores(id);
  },

  async importRecipes(json) {
    return await recipeData.importRecipes(json);
  },

  async openSharedRecipe (_id) {
    let rec = await recipeData.getSharedRecipe({_id});
    setStoreProp(localRecipes, _id, deepcopy(rec));
  },

  async setRecipeSharing (recipe, share) {
    recipe.share = share;
    let updatedRecipe = await recipeData.setRecipeSharing(recipe)
    console.log('Got updated recipe!',updatedRecipe)
    setStoredRec(updatedRecipe);
    setStoreProp(localRecipes, updatedRecipe.id, deepcopy(updatedRecipe));
  },
  
  async copySharedRecipes (recipes) {
    return await recipeData.copySharedRecipes({recipes})
  }

};

function removeIdFromStores(id) {
  activePage.update(($ids) => {
    $ids = $ids.filter((recId) => recId != id);
    return $ids;
  });
  stored.update((data) => {
    delete data[id];
    return data;
  });
  localRecipes.update((data) => {
    delete data[id];
    return data;
  });
}

export const recipeActionGeneralState = {
  subscribe: actionState.subscribe,
};
export const recipeActionState = {
  subscribe: individualActionState.subscribe,
};

export function makeLocalRecipeStore() {
  const local = writable({});
  const localRecipes = {
    /**
     * @param  {any} id local or remote ID (mongoID or ID)
     * @param  {boolean} recursive=false
     * @returns recipe
     */
    async open (id, recursize = false) {
      let mongoId;
      if (!isLocalID(id)) {
        mongoId = id;
        id = undefined;
      } else {
        let $localRecipes = get(localRecipes);
        if ($localRecipes[id]) {
          return $localRecipes[id]
        }
      }
      // Ok, create a copy from storedRec and set in localRecipes 
      let $storedRecipes = get(storedRecipes);
      var localCopy;
      let storedRec = $storedRecipes[id];
      if (!storedRec) {
        storedRec = await storedRecipes.get(id,mongoId);
      }
      if (storedRec) {
        localCopy = deepcopy(storedRec);
        local.update( // synchronous callback
          ($localRecipes)=>{
            if (storedRec.id) {
              $localRecipes[localCopy.id] = localCopy;
            }
            if (storedRec._id) {
              $localRecipes[localCopy._id] = localCopy;
            }
            return $localRecipes
          }
        );
        return localCopy        
      } else {
        throw `Failed to find recipe for id ${id} mongoId ${mongoId}`
      }
    },
    close(id) {
      local.update(($local) => {
        delete $local[id];
        return $local;
      });
    },
    ...local,
  };

  const openLocalRecipes = derived(local, ($local) => {
    return Object.keys($local).filter((id) => !isNaN(Number(id))); // only local ids
    //return Object.keys($local)
  });

  const recipeState = derived([local, stored], ([$local, $stored]) => {
    let recState = {};
    for (let key in $local) {
      recState[key] = {}; //...$state[key])}
      if (!$stored[key]) {
        recState[key].savedRemote = undefined;
        recState[key].last_modified = undefined;
      } else {
        let diff = diffRecs($local[key], $stored[key]);
        if (diff) {
          recState.changes = diff;
          recState[key].edited = true;
        } else {
          recState[key].edited = false;
        }
        if ($stored[key] && $stored[key].savedRemote) {
          recState[key].savedRemote = true;
        }
        recState[key].last_modified = $stored[key].last_modified;
      }
    }
    return recState;
  });

  return {
    localRecipes,
    openLocalRecipes,
    recipeState,
  };
}

export const categoryNames = writable([], (set) => {
  recipeData.getCategories().then((categories) => {
    set(categories.map((cname) => ({ name: cname })));
  });
  return () => {
    //console.log('no more subscribers to cats');
  };
});

export const lookupStores = {
  categories: categoryNames,
};

export const activeRecipeId = writable();

const { localRecipes, openLocalRecipes, recipeState } = makeLocalRecipeStore();
export { localRecipes, openLocalRecipes, recipeState };
