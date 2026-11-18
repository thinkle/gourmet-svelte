// The shopping list: where it lives and how it is saved.
//
// The list is a stored recipe document (isShoppingList), kept in the local
// Dexie cache and synced like any recipe (see specs/shopping-list.md). Reads
// come from the cache; every change re-reads the cached row, edits it and
// saves it through the kept glue layer (recipeData), so it reaches the server
// the same way a recipe edit does.
//
// With no signed-in database user (fixtures mode, signed out) the save goes to
// the local row only and never touches the glue layer or the network.
import { get } from "svelte/store";
import { user } from "../stores/userStore.js";
import recipeData from "../data/recipeData.js";
import localRecipeData from "../data/local/dexieApi.js";
import { chooseList, refFor, isRef, itemKey } from "./shoppingList.js";
import { parseIngredientText } from "../utils/ingredientParsing.js";

export const shopping = $state({ rec: null, loaded: false, error: null, saving: false });

let localOnly = false;
/** Fixtures mode calls this so nothing can reach the server from it. */
export const useLocalOnly = () => { localOnly = true; };
const canReachServer = () => !localOnly && !!get(user)?.remoteUser?.dbUser;

async function readRows() {
  if (!localRecipeData.db) await localRecipeData.connect();
  return localRecipeData.db.recipes.filter((r) => !!r.isShoppingList).toArray();
}

/** Read the list from the local cache. Call again after a sync. */
export async function loadShopping() {
  try {
    shopping.rec = chooseList(await readRows());
    shopping.error = null;
  } catch (err) {
    console.error("Could not read the shopping list", err);
    shopping.error = String(err?.message ?? err);
  }
  shopping.loaded = true;
}

const blankList = () => ({ title: "Shopping List", isShoppingList: 1, ingredients: [], checked: [], images: [], deleted: 0, share: 0 });

async function persist(rec) {
  if (canReachServer()) {
    if (rec.id !== undefined) await recipeData.updateRecipe(rec);
    else await recipeData.addRecipe(rec);
  } else {
    rec.last_modified = Date.now();
    rec.savedRemote = 0; // the kept sync uploads it when there is an account
    rec.id = await localRecipeData.updateRecipe(rec);
  }
}

// One change at a time: each re-reads the row, so they must not interleave.
let queue = Promise.resolve();
function change(edit) {
  const run = async () => {
    shopping.saving = true;
    try {
      const rec = chooseList(await readRows()) ?? blankList();
      edit(rec);
      rec.ingredients ??= [];
      await persist(rec);
      await loadShopping();
    } catch (err) {
      console.error("Could not save the shopping list", err);
      shopping.error = String(err?.message ?? err);
    } finally {
      shopping.saving = false;
    }
  };
  queue = queue.then(run, run);
  return queue;
}

const nextId = (rec) => rec.ingredients.reduce((n, i) => Math.max(n, Number(i.id) || 0), 0) + 1;

/** Put a recipe on the list at a multiplier; on the list already, the multipliers add. */
export const addRecipe = (recipe, mult = 1) => change((rec) => {
  const ref = refFor(recipe);
  const there = rec.ingredients.find((i) => isRef(i) && i.reference === ref);
  if (there) there.amount = { ...there.amount, amount: (there.amount?.amount || 1) + mult, unit: "recipe" };
  else {
    const entry = { id: nextId(rec), text: recipe.title, amount: { amount: mult, unit: "recipe" }, reference: ref };
    if (recipe._id) entry.referenceExists = true;
    rec.ingredients.push(entry);
  }
});

export const setRecipeMultiplier = (ref, mult) => change((rec) => {
  const e = rec.ingredients.find((i) => isRef(i) && i.reference === ref);
  if (e && mult > 0) e.amount = { ...e.amount, amount: mult, unit: "recipe" };
});

export const removeRecipe = (ref) => change((rec) => {
  rec.ingredients = rec.ingredients.filter((i) => !(isRef(i) && i.reference === ref));
});

/** A loose item, typed the way a cook writes it: "2 lb onions". */
export const addItem = (text) => change((rec) => {
  const clean = (text ?? "").trim();
  if (!clean) return;
  rec.ingredients.push({ ...parseIngredientText(clean), id: nextId(rec) });
});

export const removeItem = (ids) => change((rec) => {
  rec.ingredients = rec.ingredients.filter((i) => !(i.id !== undefined && !isRef(i) && ids.includes(i.id)));
});

/** Tick or untick an item (by its key). Also forgets ticks for items no longer on the list. */
export const setChecked = (key, on, liveKeys) => change((rec) => {
  const keep = new Set((rec.checked ?? []).filter((k) => !liveKeys || liveKeys.has(k)));
  if (on) keep.add(key); else keep.delete(key);
  rec.checked = [...keep];
});

export const clearChecked = () => change((rec) => { rec.checked = []; });

export { itemKey };
