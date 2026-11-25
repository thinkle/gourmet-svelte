// The shopping list, worked out. Plain functions, no state: a stored list
// document in, what the screen shows out. See specs/shopping-list.md.
//
// Merging is the kept logic: getShopItem names an item, addAmounts adds
// compatible amounts. The old crawler (legacy/src/stores/shoppingStores.js)
// was tied to the old stores, so this is a small rewrite of the walk only.
import { getShopItem } from "../utils/ingredientUtils.js";
import { addAmounts } from "../utils/unitAmounts.js";
import { formatAmount } from "../utils/numbers.js";
import { guessAisle, DEFAULT_AISLES } from "./shoppingAisles.js";

export const isRef = (ing) => ing && ing.reference !== undefined && ing.reference !== null && ing.reference !== "";
// getShopItem (kept) keeps words from asides and prep notes ("(2 1/2 sticks)",
// ", packed", "; adjust to taste", " -- cut back because ...") in the name, so hand it the text
// without them.
const bare = (ing) => {
  if (ing.shopItem) return ing;
  const text = (ing.text ?? "").replace(/\([^)]*\)/g, " ").split(/\s--?\s|[,;]/)[0].replace(/(^|\s)[\d\/.]+(?=\s|$)/g, " ").trim();
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

// The desktop app's default_pantry (gourmet/shopping.py), matched loosely by item name.
export const DEFAULT_ALREADY_HAVE = ["flour, all purpose", "sugar", "salt", "black pepper, ground", "ice", "water", "oil, vegetable", "oil, olive"];

// "all-purpose flour" and "flour, all purpose" are the same thing; so are "extra-virgin olive oil" and "oil, olive".
const NOISE = new Set(["all", "purpose", "extra", "virgin", "kosher", "table", "granulated", "fine", "white", "plain", "ground", "pure"]);
const tokens = (s) => new Set(String(s).toLowerCase().split(/[^a-zÀ-ſ]+/).filter((w) => w && !NOISE.has(w)));
const sameSet = (a, b) => a.size === b.size && [...a].every((x) => b.has(x));
const DEFAULT_TOKENS = DEFAULT_ALREADY_HAVE.map(tokens);
export const matchesDefault = (name) => { const t = tokens(name); return t.size > 0 && DEFAULT_TOKENS.some((d) => sameSet(d, t)); };

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** The item key stored recipes already carry (ingkey, shopItem), else the cleaned getShopItem. */
export function baseKey(ing) {
  const stored = (typeof ing.ingkey === "string" && ing.ingkey.trim()) || (typeof ing.shopItem === "string" && ing.shopItem.trim());
  return stored ? stored.toLowerCase() : itemKey(ing);
}
const baseName = (ing) => {
  const stored = (typeof ing.ingkey === "string" && ing.ingkey.trim()) || (typeof ing.shopItem === "string" && ing.shopItem.trim());
  return stored ? cap(stored) : itemName(ing);
};

/**
   The list as the screen shows it.
   `rec` is the stored shopping-list document (or null), `recipes` the prepared
   library. Fields read from the document (see specs/shopping-list.md):
   cart, alreadyHave, alreadyHaveOff, trip, aisles {key: name},
   aisleOrder [name], keyAliases {key: key}.
   Returns {recipes, items, groups (to buy, by category), cart, alreadyHave,
   categoryNames (in order), keys}.
*/
export function buildList(rec, recipes) {
  const entries = rec?.ingredients ?? [];
  const cartSet = new Set(rec?.cart ?? []);
  const have = new Set(rec?.alreadyHave ?? []);
  const haveOff = new Set(rec?.alreadyHaveOff ?? []); // taken out of Already have though a default or an old "ignore" says it is there
  const trip = new Set(rec?.trip ?? []); // Already have items wanted on this trip
  const cats = rec?.aisles ?? {};
  const aliases = rec?.keyAliases ?? {};
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
    const base = baseKey(l.ing);
    const key = aliases[base] ?? base;
    l.base = base;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(l);
  }
  const items = [...byKey.entries()].map(([key, ls]) => {
    const scaled = ls.map((l) => scale(l.ing.amount, l.mult)).filter(Boolean);
    const amounts = scaled.length ? addAmounts(scaled, key).map((a) => ({ ...a, text: [formatAmount(a), a.unit].filter(Boolean).join(" ") })) : [];
    const name = ls.every((l) => l.base === key) ? baseName(ls[0].ing) : cap(key);
    // Already have: what you said, the desktop app's defaults, and old recipes' shopIgnore (read only).
    const hint = ls.some((l) => l.ing.shopIgnore === true) || matchesDefault(name);
    const alreadyHave = (have.has(key) || (hint && !haveOff.has(key))) && !trip.has(key);
    const inCart = cartSet.has(key);
    return {
      key,
      baseKeys: [...new Set(ls.map((l) => l.base))],
      name,
      amounts,
      category: cats[key] || null, // the user's choice (stored)
      guess: cats[key] ? null : guessAisle(name), // computed, never stored
      state: alreadyHave ? "have" : inCart ? "cart" : "buy",
      onTrip: trip.has(key),
      from: ls.map((l) => ({
        title: l.source, // null for a loose item
        mult: l.mult,
        text: l.ing.originalText || [formatAmount(l.ing.amount), l.ing.amount?.unit, l.ing.text].filter(Boolean).join(" "),
      })),
      looseIds: ls.filter((l) => l.loose).map((l) => l.ing.id),
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  for (const i of items) i.aisle = i.category ?? i.guess ?? null;
  // Aisle order: the user's saved order, then the default walking order, then any other
  // names A to Z. Items with no aisle come last, as "Other".
  const order = rec?.aisleOrder ?? [];
  const present = new Set([...items.map((i) => i.aisle), ...order].filter(Boolean));
  const known = new Set([...DEFAULT_AISLES, ...Object.values(cats), ...order]);
  const rank = (n) => (order.includes(n) ? order.indexOf(n) : 1000 + (DEFAULT_AISLES.includes(n) ? DEFAULT_AISLES.indexOf(n) : 100));
  const byRank = (a, b) => rank(a) - rank(b) || a.localeCompare(b);
  const categoryNames = [...present].sort(byRank);
  // For choosing an aisle: every known aisle, the most used (on this list) first.
  const uses = (n) => items.filter((i) => i.aisle === n).length;
  const aisleChoices = [...known].sort((a, b) => uses(b) - uses(a) || byRank(a, b));
  const buy = items.filter((i) => i.state === "buy");
  const groups = [...categoryNames, null]
    .map((name) => ({ name, items: buy.filter((i) => i.aisle === name) }))
    .filter((g) => g.items.length);
  return {
    recipes: onList,
    items,
    groups,
    buyCount: buy.length,
    cart: items.filter((i) => i.state === "cart"),
    alreadyHave: items.filter((i) => i.state === "have"),
    categoryNames,
    aisleChoices,
    keys: new Set(byKey.keys()),
  };
}

/** Pick the document to use when there are several. */
export function chooseList(rows) {
  const live = rows.filter((r) => r.isShoppingList && !r.deleted);
  live.sort((a, b) => (b.ingredients?.length ?? 0) - (a.ingredients?.length ?? 0) || (b.last_modified ?? 0) - (a.last_modified ?? 0));
  return live[0] ?? null;
}
