// The shopping list, worked out. Plain functions, no state: a stored list
// document in, what the screen shows out. See specs/shopping-list.md.
//
// Merging is the kept logic: getShopItem names an item, addAmounts adds
// compatible amounts. The old crawler (legacy/src/stores/shoppingStores.js)
// was tied to the old stores, so this is a small rewrite of the walk only.
import { getShopItem } from "../utils/ingredientUtils.js";
import { addAmounts } from "../utils/unitAmounts.js";
import { formatAmount } from "../utils/numbers.js";

export const isRef = (ing) => ing && ing.reference !== undefined && ing.reference !== null && ing.reference !== "";
// getShopItem (kept) keeps words from asides and prep notes ("(2 1/2 sticks)",
// ", packed", " -- cut back because ...") in the name, so hand it the text
// without them.
const bare = (ing) => {
  if (ing.shopItem) return ing;
  const text = (ing.text ?? "").replace(/\([^)]*\)/g, " ").split(/\s--?\s|,/)[0].replace(/(^|\s)[\d\/.]+(?=\s|$)/g, " ").trim();
  return { ...ing, text: text || ing.text };
};
export const itemName = (ing) => getShopItem(bare(ing));
export const itemKey = (ing) => itemName(ing).toLowerCase();

/** Find the recipe a reference points at: by Mongo _id, else by local id. */
export function findRecipe(recipes, ref) {
  return recipes.find((r) => r._id === ref) ?? recipes.find((r) => r.id === ref || (r._id === undefined && String(r.id) === String(ref)));
}

/** The reference value to store for a recipe. */
export const refFor = (r) => r._id ?? r.id;

const scale = (amount, mult) => {
  if (!amount || typeof amount.amount !== "number") return null;
  return { ...amount, amount: amount.amount * mult, ...(typeof amount.rangeAmount === "number" ? { rangeAmount: amount.rangeAmount * mult } : {}) };
};

/** Every leaf ingredient under a list, following groups and nested recipe references. */
function walk(list, mult, source, recipes, seen, out, missing) {
  for (const ing of list ?? []) {
    if (!ing) continue;
    if (ing.ingredients) walk(ing.ingredients, mult, source, recipes, seen, out, missing);
    else if (isRef(ing)) {
      const target = findRecipe(recipes, ing.reference);
      const times = ing.amount?.amount && ing.amount.amount !== 1 ? ing.amount.amount : 1;
      if (!target) { missing.push(ing); continue; }
      if (seen.includes(target.id)) continue; // a recipe that contains itself
      walk(target.ingredients, mult * times, source, recipes, [...seen, target.id], out, missing);
    } else if (ing.text) out.push({ ing, mult, source });
  }
}

/**
   The list as the screen shows it.
   `rec` is the stored shopping-list document (or null), `recipes` the prepared
   library. Returns {recipes: [...on the list], items: [...merged, A to Z]}.
*/
export function buildList(rec, recipes) {
  const entries = rec?.ingredients ?? [];
  const checked = new Set(rec?.checked ?? []);
  const onList = [];
  const leaves = [];
  const missing = [];
  for (const e of entries) {
    if (isRef(e)) {
      const target = findRecipe(recipes, e.reference);
      const mult = e.amount?.amount || 1;
      onList.push({ entry: e, id: e.reference, title: target?.title ?? e.text ?? "(recipe)", mult, found: !!target, recipe: target });
      if (target) walk(target.ingredients, mult, target.title, recipes, [target.id], leaves, missing);
    } else if (e?.text) {
      leaves.push({ ing: e, mult: 1, source: null, loose: true });
    }
  }
  const byKey = new Map();
  for (const l of leaves) {
    const key = itemKey(l.ing);
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(l);
  }
  const items = [...byKey.entries()].map(([key, ls]) => {
    const scaled = ls.map((l) => scale(l.ing.amount, l.mult)).filter(Boolean);
    const amounts = scaled.length ? addAmounts(scaled, key).map((a) => ({ ...a, text: [formatAmount(a), a.unit].filter(Boolean).join(" ") })) : [];
    return {
      key,
      name: itemName(ls[0].ing),
      amounts,
      checked: checked.has(key),
      from: ls.map((l) => ({
        title: l.source, // null for a loose item
        mult: l.mult,
        text: l.ing.originalText || [formatAmount(l.ing.amount), l.ing.amount?.unit, l.ing.text].filter(Boolean).join(" "),
      })),
      looseIds: ls.filter((l) => l.loose).map((l) => l.ing.id),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
  return { recipes: onList, items, keys: new Set(byKey.keys()) };
}

/** Pick the document to use when there are several. */
export function chooseList(rows) {
  const live = rows.filter((r) => r.isShoppingList && !r.deleted);
  live.sort((a, b) => (b.ingredients?.length ?? 0) - (a.ingredients?.length ?? 0) || (b.last_modified ?? 0) - (a.last_modified ?? 0));
  return live[0] ?? null;
}
