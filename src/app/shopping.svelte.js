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

const blankList = () => ({ title: "Shopping List", isShoppingList: 1, ingredients: [], images: [], deleted: 0, share: 0 });

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

const without = (arr, k) => (arr ?? []).filter((x) => x !== k);
const withKey = (arr, k) => [...new Set([...(arr ?? []), k])];

// The three states of an item (desktop Gourmet's shopping list and pantry, plus the store trip):
//   To buy -> In the cart (this trip) -> gone at "Done shopping"
//   Already have (remembered for every list); "this trip" puts one back in To buy
// All of it is stored on the list document: cart, alreadyHave, alreadyHaveOff, trip.

/** Tap an item into the cart, or back out of it. */
export const setCart = (key, on) => change((rec) => {
  rec.cart = on ? withKey(rec.cart, key) : without(rec.cart, key);
});

/** "Already have" for good (every list), or out of it again. */
export const setAlreadyHave = (key, on) => change((rec) => {
  rec.trip = without(rec.trip, key);
  rec.cart = without(rec.cart, key);
  if (on) { rec.alreadyHave = withKey(rec.alreadyHave, key); rec.alreadyHaveOff = without(rec.alreadyHaveOff, key); }
  else {
    // alreadyHaveOff also overrides a default or an old recipe's "ignore", which are never written to.
    rec.alreadyHave = without(rec.alreadyHave, key);
    rec.alreadyHaveOff = withKey(rec.alreadyHaveOff, key);
  }
});

/** An Already have item wanted on this trip only. */
export const wantThisTrip = (key) => change((rec) => { rec.trip = withKey(rec.trip, key); });

/** The trip is over: empty the cart and forget this trip's put-backs. */
export const doneShopping = () => change((rec) => { rec.cart = []; rec.trip = []; });

/** Shopping category (aisle) for an item key, remembered for every future list. Empty name clears it. */
export const setCategory = (key, name) => change((rec) => {
  const n = (name ?? "").trim();
  rec.aisles = { ...(rec.aisles ?? {}) };
  if (n) rec.aisles[key] = n;
  else delete rec.aisles[key];
});

/** Save the category order (the full list, as shown). */
export const setCategoryOrder = (names) => change((rec) => { rec.aisleOrder = [...names]; });

/** Rename or merge an item: every ingredient that had these keys is now this key. */
export const renameItem = (baseKeys, currentKey, newName) => change((rec) => {
  const target = (newName ?? "").trim().toLowerCase();
  if (!target) return;
  rec.keyAliases = { ...(rec.keyAliases ?? {}) };
  for (const b of baseKeys) { if (b === target) delete rec.keyAliases[b]; else rec.keyAliases[b] = target; }
  // The item keeps its category and state under the new key.
  const move = (arr) => (arr ?? []).map((k) => (k === currentKey ? target : k));
  rec.cart = move(rec.cart); rec.alreadyHave = move(rec.alreadyHave); rec.trip = move(rec.trip);
  rec.aisles = { ...(rec.aisles ?? {}) };
  if (rec.aisles[currentKey] && !rec.aisles[target]) rec.aisles[target] = rec.aisles[currentKey];
});

export { itemKey };
