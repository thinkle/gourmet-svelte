// "Integer" ingredients: things you count in whole pieces (eggs, bananas),
// so a recipe can be scaled "for 4 eggs". Pure and simple on purpose: a list of
// nouns, and a line only counts when its amount is a plain count (no cup, no
// gram) or a count-like unit ("2 large eggs", "3 cloves garlic").
//
// Ideas for more, not built: tortillas, chicken breasts/thighs, sausages,
// pork chops, bread slices, sheets of puff pastry, cans, tea bags, stick of butter
// (but halves are common there), squares of chocolate.

// Order matters: "egg yolk" must be tried before "egg".
const COUNTABLES = [
  { key: "egg yolk", one: "egg yolk", many: "egg yolks", re: /\begg yolks?\b/i },
  { key: "egg white", one: "egg white", many: "egg whites", re: /\begg whites?\b/i },
  { key: "egg", one: "egg", many: "eggs", re: /\beggs?\b/i },
  { key: "banana", one: "banana", many: "bananas", re: /\bbananas?\b/i },
  { key: "avocado", one: "avocado", many: "avocados", re: /\bavocados?\b/i },
  { key: "lemon", one: "lemon", many: "lemons", re: /\blemons?\b/i },
  { key: "lime", one: "lime", many: "limes", re: /\blimes?\b/i },
  { key: "apple", one: "apple", many: "apples", re: /\bapples?\b/i },
  { key: "onion", one: "onion", many: "onions", re: /\bonions?\b/i },
  { key: "shallot", one: "shallot", many: "shallots", re: /\bshallots?\b/i },
  { key: "bell pepper", one: "bell pepper", many: "bell peppers", re: /\bbell peppers?\b/i },
  { key: "potato", one: "potato", many: "potatoes", re: /\bpotato(es)?\b/i },
  { key: "garlic clove", one: "garlic clove", many: "garlic cloves", re: /\bgarlic\b/i, unit: /^cloves?$/i },
];

// Units that still mean "this many whole ones".
const COUNT_UNITS = /^(large|medium|small|whole|each|ea\.?)$/i;

function flat(list, out = []) {
  for (const i of list ?? []) {
    if (i && Array.isArray(i.ingredients)) flat(i.ingredients, out);
    else if (i && typeof i === "object") out.push(i);
  }
  return out;
}

/** The countable noun of one ingredient line, or null. */
export function countableOf(ing) {
  const a = ing?.amount;
  if (!a || typeof a.amount !== "number" || !(a.amount > 0) || a.rangeAmount !== undefined) return null;
  const unit = (a.unit ?? "").trim();
  const text = String(ing.text ?? "");
  for (const c of COUNTABLES) {
    if (!c.re.test(text)) continue;
    if (c.unit ? c.unit.test(unit) : (!unit || COUNT_UNITS.test(unit))) {
      // "lemon juice", "egg noodles", "potato starch": not the whole thing.
      if (/\b(juice|zest|noodles?|starch|powder|rind|peel|extract|wash)\b/i.test(text) && !/\bjuiced|zested\b/i.test(text)) return null;
      return c;
    }
  }
  return null;
}

/**
   The countables of a recipe, with how many it uses in all:
   [{key, one, many, base}], eggs first, then in the order they appear.
**/
export function countables(recipe, max = 2) {
  const found = new Map();
  for (const ing of flat(recipe?.ingredients)) {
    const c = countableOf(ing);
    if (!c) continue;
    const row = found.get(c.key) ?? { key: c.key, one: c.one, many: c.many, base: 0 };
    row.base += ing.amount.amount;
    found.set(c.key, row);
  }
  const rows = [...found.values()].filter((r) => r.base >= 1);
  rows.sort((a, b) => (b.key === "egg") - (a.key === "egg"));
  return rows.slice(0, max);
}

/** The noun for a count: "1 egg", "4 eggs". */
export const nounFor = (row, n) => (Math.abs(n - 1) < 1e-9 ? row.one : row.many);
