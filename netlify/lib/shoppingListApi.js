import crypto from 'crypto';
import deepcopy from 'deepcopy';
import { loadDB } from '../../src/data/functions/mongoConnect.js';
import { prepRecRemote } from '../../src/data/utils/validate.js';
import { parseIngredientText } from '../../src/utils/ingredientParsing.js';
import { buildList, chooseList, isRef, baseKey } from '../../src/app/shoppingList.js';

export const shoppingError = (statusCode, message) => Object.assign(new Error(message), { statusCode });
const text = (s, label, max = 500) => {
  if (typeof s !== 'string' || !s.trim() || s.length > max) throw shoppingError(400, `Invalid ${label}.`);
  return s.trim();
};
const alive = { $nin: [1, true] };
const filterFor = (account) => ({ 'owner.email': account, isShoppingList: 1, deleted: alive });

async function choose(collection, account, listId, create = false) {
  const filter = filterFor(account);
  if (listId) {
    const found = await collection.findOne({ ...filter, _id: listId });
    if (!found) throw shoppingError(404, 'Shopping list not found in this account.');
    return found;
  }
  const found = chooseList(await collection.find(filter).toArray());
  if (found || !create) return found;
  // A deterministic first-list id makes simultaneous first adds converge on one document.
  const _id = `shopping-${crypto.createHash('sha256').update(account).digest('hex')}`;
  const blank = { _id, title: 'Shopping List', isShoppingList: 1, ingredients: [],
    images: [], deleted: 0, share: 0, last_modified: Date.now() };
  prepRecRemote(blank, { email: account });
  try { await collection.updateOne({ _id, 'owner.email': account }, { $setOnInsert: blank }, { upsert: true }); }
  catch (err) { if (err.code !== 11000) throw err; }
  const created = await collection.findOne({ ...filter, _id });
  if (!created) throw shoppingError(409, 'The default shopping list was deleted. Create a new list in the app first.');
  return created;
}

async function sourceRecipes(collection, account) {
  // Give the traversal stable ids: stored numeric ids belong to the creating device.
  return (await collection.find({ 'owner.email': account, isShoppingList: { $ne: 1 }, deleted: alive },
    { projection: { _id: 1, title: 1, ingredients: 1 } }).toArray()).map((r) => ({ ...r, id: r._id }));
}

export function shoppingView(rec, recipes) {
  const list = buildList(rec, recipes);
  return {
    listId: rec?._id || null,
    recipes: list.recipes.map((r) => ({ recipeId: String(r.id), title: r.title, multiplier: r.mult, found: r.found })),
    items: list.items.map((i) => ({ key: i.key, name: i.name, amounts: i.amounts,
      category: i.aisle, categorySource: i.category ? 'assigned' : i.guess ? 'suggested' : 'none',
      state: i.state, sources: i.from, looseIds: i.looseIds.filter(Number.isSafeInteger) })),
    categories: list.aisleChoices,
    excludedItems: rec?.excludedItems || [],
  };
}

function validate(command, input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw shoppingError(400, 'Expected a JSON object.');
  if (input.listId !== undefined) text(input.listId, 'listId', 200);
  if (command === 'items/add') return { item: parseIngredientText(text(input.text, 'item text', 2000)) };
  if (command === 'recipes/add' || command === 'recipes/remove') {
    const recipeId = text(input.recipeId, 'recipeId', 200);
    const multiplier = input.multiplier === undefined ? 1 : input.multiplier;
    if (command === 'recipes/add' && (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0 || multiplier > 10000)) {
      throw shoppingError(400, 'Multiplier must be a positive number no greater than 10000.');
    }
    return { recipeId, multiplier };
  }
  if (command === 'items/remove') return { key: text(input.key, 'item key') };
  if (command === 'items/categorize') {
    if (!Array.isArray(input.keys) || !input.keys.length || input.keys.length > 100) {
      throw shoppingError(400, 'Provide between 1 and 100 item keys.');
    }
    const keys = [...new Set(input.keys.map((k) => text(k, 'item key')))];
    const category = input.category === null ? null : text(input.category, 'category', 100);
    return { keys, category };
  }
  if (command !== 'read') throw shoppingError(404, 'Unknown shopping-list command.');
  return {};
}

function changesFor(command, values, rec, recipes) {
  const ingredients = deepcopy(rec.ingredients || []);
  const nextId = () => ingredients.reduce((n, i) => Math.max(n, Number(i.id) || 0), 0) + 1;
  const aliases = rec.keyAliases || {};
  const canonical = (ing) => aliases[baseKey(ing)] || baseKey(ing);
  if (command === 'items/add') {
    const item = { ...values.item, id: nextId() };
    ingredients.push(item);
    return { ingredients, excludedItems: (rec.excludedItems || []).filter((k) => k !== canonical(item)) };
  }
  if (command === 'recipes/add') {
    const recipe = recipes.find((r) => r._id === values.recipeId);
    if (!recipe) throw shoppingError(404, 'Recipe not found in this account.');
    const entry = ingredients.find((i) => isRef(i) && i.reference === values.recipeId);
    if (entry) entry.amount = { ...entry.amount, amount: (entry.amount?.amount || 1) + values.multiplier, unit: 'recipe' };
    else ingredients.push({ id: nextId(), text: recipe.title, reference: recipe._id, referenceExists: true,
      amount: { amount: values.multiplier, unit: 'recipe' } });
    return { ingredients };
  }
  if (command === 'recipes/remove') {
    if (!ingredients.some((i) => isRef(i) && i.reference === values.recipeId)) throw shoppingError(404, 'Recipe is not on this shopping list.');
    return { ingredients: ingredients.filter((i) => !(isRef(i) && i.reference === values.recipeId)) };
  }
  const view = buildList(rec, recipes);
  const keys = command === 'items/remove' ? [values.key] : values.keys;
  if (keys.some((key) => !view.keys.has(key))) throw shoppingError(404, 'An item key is not on this shopping list. Read the list for exact keys.');
  if (command === 'items/remove') {
    return {
      ingredients: ingredients.filter((i) => isRef(i) || canonical(i) !== values.key),
      excludedItems: [...new Set([...(rec.excludedItems || []), values.key])],
    };
  }
  const aisles = { ...(rec.aisles || {}) };
  for (const key of keys) {
    if (values.category === null) delete aisles[key];
    else Object.defineProperty(aisles, key, { value: values.category, enumerable: true, configurable: true, writable: true });
  }
  return { aisles };
}

export async function shoppingCommand(account, command, input) {
  const values = validate(command, input);
  const { db } = await loadDB();
  const collection = db.collection('recipes');
  const recipes = await sourceRecipes(collection, account);
  // Validate a recipe reference before a first add can create any document.
  if (command === 'recipes/add' && !recipes.some((r) => r._id === values.recipeId)) {
    throw shoppingError(404, 'Recipe not found in this account.');
  }
  let rec = await choose(collection, account, input.listId, command === 'items/add' || command === 'recipes/add');
  if (command === 'read') return shoppingView(rec, recipes);
  if (!rec) throw shoppingError(404, 'No shopping list exists yet.');
  for (let attempt = 0; attempt < 8; attempt++) {
    const changes = changesFor(command, values, rec, recipes);
    // Check the fields used to calculate a change, including aliases. Concurrent live cart
    // writes need not block us: cart/pantry/images/live metadata are never replaced here.
    const filter = { ...filterFor(account), _id: rec._id };
    for (const key of ['ingredients', 'keyAliases', 'excludedItems', 'aisles']) {
      filter[key] = Object.hasOwn(rec, key) ? { $eq: rec[key] } : { $exists: false };
    }
    const prepared = { ...deepcopy(rec), ...changes };
    prepRecRemote(prepared, { email: account });
    const fields = { ...changes, last_modified: Date.now() };
    if (Object.hasOwn(changes, 'ingredients')) {
      fields.fullText = prepared.fullText;
      fields.flatIngredients = prepared.flatIngredients;
    }
    // $literal keeps strings beginning with '$' in item names/categories as data.
    const result = await collection.findOneAndUpdate(filter, [
      { $set: Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, { $literal: value }])) },
      { $set: { last_remote_save: '$$NOW' } },
    ], { returnOriginal: false });
    if (result.value) return shoppingView(result.value, recipes);
    rec = await choose(collection, account, rec._id);
  }
  throw shoppingError(409, 'The shopping list changed repeatedly. Read it and retry the command.');
}
