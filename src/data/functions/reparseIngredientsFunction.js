/**
   A one-off maintenance pass for recipes written before the API parsed
   ingredients. Those recipes stored whole lines in the name field
   ({text: '250g all-purpose flour'}) with no amount at all, so nothing that
   reads amounts -- scaling, shopping lists -- works on them.

   Runs in batches so a single invocation stays well inside the function
   timeout: the caller pages with `offset` until `done`. Sorting is by _id
   rather than last_modified so that rewriting recipes mid-scan can't shuffle
   the pages underneath us.
**/
import { queryCollection } from './mongoConnect.js';
import { updateRecipe } from './updateRecipe.js';
import { reparseIngredients } from '../../utils/ingredientParsing.js';

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 100;

// Leaf ingredients we still couldn't give an amount to, so a caller can see
// what the pass is leaving behind rather than assuming it got everything.
function collectUnparsed(list, into) {
    if (!Array.isArray(list)) { return into; }
    list.forEach((ingredient) => {
        if (!ingredient || typeof ingredient !== 'object') { return; }
        if (Array.isArray(ingredient.ingredients)) {
            collectUnparsed(ingredient.ingredients, into);
            return;
        }
        const amount = ingredient.amount;
        const hasAmount = amount && typeof amount === 'object'
            && (typeof amount.amount === 'number'
                || typeof amount.rangeAmount === 'number'
                || Boolean(amount.unit));
        if (!hasAmount && ingredient.text) {
            into.push(ingredient.text);
        }
    });
    return into;
}

export async function reparseRecipeIngredients(user, params = {}) {
    const dryRun = params.dryRun !== false; // opt in to writing, never default to it
    const limit = Math.min(Number(params.limit) || DEFAULT_LIMIT, MAX_LIMIT);
    const offset = Number(params.offset) || 0;

    const { count, result } = await queryCollection(
        'recipes',
        { 'owner.email': user.account, deleted: { $ne: 1 } },
        { limit, page: offset, sort: { _id: 1 } }
    );

    const changedRecipes = [];
    const stillUnparsed = [];
    for (const recipe of result) {
        const { ingredients, changes } = reparseIngredients(recipe.ingredients);
        if (changes.length) {
            changedRecipes.push({ _id: recipe._id, title: recipe.title, changes });
            if (!dryRun) {
                await updateRecipe(user, {
                    recipe: { ...recipe, ingredients },
                    replace: true,
                    keepLastModified: true,
                });
            }
        }
        collectUnparsed(changes.length ? ingredients : recipe.ingredients, stillUnparsed);
    }

    const nextOffset = offset + result.length;
    return {
        dryRun,
        total: count,
        offset,
        nextOffset,
        scanned: result.length,
        done: result.length === 0 || nextOffset >= count,
        recipesChanged: changedRecipes.length,
        ingredientsChanged: changedRecipes.reduce((n, r) => n + r.changes.length, 0),
        stillUnparsedCount: stillUnparsed.length,
        stillUnparsedSample: stillUnparsed.slice(0, 5),
        recipes: changedRecipes,
    };
}
