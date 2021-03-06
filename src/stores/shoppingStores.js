import { readable, writable, get, derived } from "svelte/store";
import { makeLocalRecipeStore, recipeActions } from "./recipeStores.js";
import api from "../data/recipeData.js";
import deepcopy from "deepcopy";

const { localRecipes, recipeState, openLocalRecipes } = makeLocalRecipeStore();

export let storedShopRec = writable(); // holds stored copy of recipe
export let localShopRec = writable(); // holds the shopping list recipe
let shopRecMongoId;

localShopRec.subscribe((v) => (shopRecMongoId = v && v._id));
let crawlingShoppingList = false;
let sl = derived(
  [localShopRec, localRecipes],
  async ([$localShopRec, $localRecipes], set) => {
    if (!$localShopRec) {
      set([]);
    } else if (!crawlingShoppingList) {      
      let allItems = [];
      crawlingShoppingList = true;
      await crawlIngredients(
        $localShopRec.ingredients,
        { title: "Shopping List", isTheShoppingList: true, id: -1 },
        $localRecipes,
        allItems,
        1,
        [$localShopRec.id]
      );
      set(allItems);
      crawlingShoppingList = false;
    }
  }
);

export let recipesOnList = derived(
  localShopRec,
  ($localShopRec) =>
    ($localShopRec &&
      $localShopRec.ingredients
        .filter((i) => i.reference)
        .map((i) => ({
          id: i.reference,
          title: i.text,
          multiplier: i.amount && i.amount.amount,
        }))) ||
    []
);

async function crawlIngredients(
  ingredientList,
  source,
  $localRecipes,
  items,
  multiplier,
  parentRecs = [],
  useParentAsSource = false
) {
  for (let ingredient of ingredientList) {
    if (ingredient.ingredients) {
      //  group
      await crawlIngredients(
        ingredient.ingredients,
        source,
        $localRecipes,
        items,
        multiplier,
        parentRecs,
        useParentAsSource
      );
    } else if (ingredient.reference) {
      // reference
      if (parentRecs.includes(ingredient.reference)) {
        console.log("-No circular crawling - ignoring ", ingredient);
      } else {
        let recipe = $localRecipes[ingredient.reference];
        if (!recipe) {
          try {
            recipe = await localRecipes.open(ingredient.reference); // will trigger derived to run again...
          } catch (err) {
            console.log(
              "-Referenced recipe",
              ingredient,
              "does not exist, push as ingredient rather than crawling"
            );
            items.push({ source, ingredient, multiplier });
          }
        }
        if (recipe) {
          if (recipe.ingredients) {
            let recMultiplier = 1;
            if (
              ingredient.amount &&
              ingredient.amount.amount &&
              ingredient.amount.amount != 1
            ) {
              recMultiplier = ingredient.amount.amount;
            }
            await crawlIngredients(
              recipe.ingredients,
              (useParentAsSource && source) || recipe,
              $localRecipes,
              items,
              recMultiplier * multiplier,
              [...parentRecs, recipe.id],
              true
            );
          } else {
            items.push({ source, ingredient, multiplier });
          }
        }
      }
    } else {
      // normal ingredient
      items.push({ source, ingredient, multiplier });
    }
  }
}

export const shoppingList = {
  getShoppingRecipeId() {
    let $sr = get(storedShopRec);
    if (!$sr) {
      return undefined;
    } else {
      return $sr.id;
    }
  },
  async get() {
    // Look for an existing shopping list recipe...
    let r;
    let { result, count } = await api.getRecipes({
      query: { isShoppingList: true },
    });
    //let count = 0; let result;
    if (count) {
      r = result[0];
    } else {
      // If it doesn't exist, create one...
      r = await recipeActions.createRecipe({
        title: "Shopping List",
        ingredients: [],
        isShoppingList: 1,
      });
    }
    // make local copy...
    storedShopRec.update(() => r);
    localShopRec.update(() => deepcopy(r));
  },

  clear() {
    localShopRec.update(($r) => {
      $r.ingredients = [];
      return $r;
    });
  },

  /**
       Add recipe to shopping list
    **/
  async addRecipe(id, quantity = 1) {
    let recipe = await localRecipes.open(id);
    let ingredient = {
      amount: {
        amount: quantity,
        unit: "recipe",
      },
      text: recipe.title,
      reference: recipe._id || recipe.id, // fallback to local ID won't really work very well...
    };
    if (!get(localShopRec)) {
      await shoppingList.get();
    }
    localShopRec.update(($localShopRec) => {
      let alreadyThere = $localShopRec.ingredients.find(
        (i) => i.reference == id
      );
      if (alreadyThere) {
        alreadyThere.amount.amount += quantity;
      } else {
        $localShopRec.ingredients.push(ingredient);
      }
      return $localShopRec;
    });
    let updatedShopRec = await api.addToRecipe({
      _id: shopRecMongoId,
      ingredients: [ingredient],
    });
    storedShopRec.set(updatedShopRec);
    localShopRec.set(updatedShopRec);
  },
  /**
       Remove recipe from shopping list
    **/
  removeRecipe(id, quantity) {
    localShopRec.update(($localShopRec) => {
      $localShopRec.ingredients = $localShopRec.ingredients.filter(
        (item) => item.reference != id
      );
      return $localShopRec;
    });
  },
  /**
       Update quantity of a recipe on our shopping list
    **/
  updateRecipeQuantity(id, quantity) {
    localShopRec.update(($localShopRec) => {
      let ing = $localShopRec.ingredients.find((i) => i.reference == id);
      if (!ing) {
        throw new Error(
          `No recipe on list with ID ${id}: ${$localShopRec.ingredients}`
        );
      }
      ing.amount.amount = quantity;
      return $localShopRec;
    });
  },

  setShopItem(item, shopItem, shopIgnore) {
    if (!item.source) {
      throw new Error("item must have source to change shopitem");
    }
    if (!item.source.id) {
      throw new Error("item source must have ID to change shopitem");
    }
    if (shopItem) {
      item.ingredient.shopItem = shopItem; // the object is actually attached to our local recipe anyway...
    }
    if (shopIgnore !== undefined) {
      item.ingredient.shopIgnore = shopIgnore;
    }
    localRecipes.update(($localRecipes) => {
      $localRecipes[item.source.id] = $localRecipes[item.source.id];
      return $localRecipes;
    });
  },

  /* Add custom item to shopping list */
  addItem(ingredient) {
    return new Promise((resolve, reject) => {
      let id = 0;
      localShopRec.update(($localShopRec) => {
        if (!$localShopRec) {
          reject(
            `No shopping list loaded: $localShopRec falsey ${$localShopRec}`
          );
        }
        if (!$localShopRec.ingredients) {
          reject(
            `$localShopRec does not have an ingredient list defined? ${$localShopRec}`
          );
        }
        $localShopRec.ingredients.forEach((i) => {
          if (i.id >= id) {
            id = i.id + 1;
          }
        });
        $localShopRec.ingredients.forEach((i) => {
          if (!i.id) {
            i.id = id + 1;
            id += 1;
          }
        });
        ingredient.id = id;
        $localShopRec.ingredients.push(ingredient);
        resolve(id);
        // Now push to remote...
        api
          .addToRecipe({ _id: shopRecMongoId, ingredients: [ingredient] })
          .then((rec) => {
            storedShopRec.set(rec);
            localShopRec.set(rec);
          });
        return $localShopRec;
      });
    });
  },
  /* Remove custom item from shopping list */
  removeItem(id) {
    localShopRec.update(($localShopRec) => {
      $localShopRec.ingredients = $localShopRec.ingredients.filter(
        (i) => i.id != id
      );
      return $localShopRec;
    });
  },

  /* Update recipe list item */
  updateItem(shoppingItem) {
    return new Promise((resolve, reject) => {
      localShopRec.update(($localShopRec) => {
        let replaced;
        $localShopRec.ingredients = $localShopRec.ingredients.map((i) => {
          if (i.id == shoppingItem.id && !replaced) {
            replaced = true;
            return shoppingItem;
          } else {
            return i;
          }
        });
        if (replaced) {
          resolve($localShopRec.ingredients);
        } else {
          reject(`No item with ID ${id} found in ${$localShopRec.ingredients}`);
        }
        return $localShopRec;
      }); // end update
    }); // end promise
  },

  async save() {
    // FIX ME
    let result = await api.updateRecipe(get(localShopRec));
    storedShopRec.update(() => result);
    localShopRec.update(() => deepcopy(result));
    // Now update our local recipes as well...
    let $recipeState = get(recipeState);
    let $localRecipes = get(localRecipes);
    for (let recid of get(openLocalRecipes)) {
      if ($recipeState[recid].edited) {
        await api.updateRecipe($localRecipes[recid]);
      }
    }
    return result;
  },

  subscribe: sl.subscribe,
};
