import { refFor } from './shoppingList.js';

export function recipeChoices(recipes, current, query = '') {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return recipes.filter((r) => {
    if (!r || r.deleted || r.isShoppingList || refFor(r) == null) return false;
    if ((current?._id != null && r._id === current._id) || (current?.id != null && r.id === current.id)) return false;
    const text = [r.title, ...(r.categories ?? []).map((c) => c?.name || c)].join(' ').toLocaleLowerCase();
    return words.every((word) => text.includes(word));
  }).sort((a,b) => (a.title || '').localeCompare(b.title || ''));
}

export function recipeIngredient(recipe, batches = 1) {
  const reference = refFor(recipe);
  if (reference == null || reference === '') throw new Error('Choose a saved recipe.');
  if (!Number.isFinite(batches) || batches <= 0) throw new Error('Use a positive number of batches.');
  return { text: recipe.title || '(untitled)', reference, amount: {amount: batches, unit: 'recipe'} };
}
