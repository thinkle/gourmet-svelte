import { surfaceVars } from "contain-css-svelte";

// Gourmet's own colour logic: chocolate is brown, lemon is yellow, Halloween is black and orange.
import { getColor, wordColors } from "../common/colors.js";
// Gourmet's own ingredient matcher: wraps mentions of an ingredient in the
// text with <ing target="ingredient text">…</ing>.
import { parseIngredients } from "../utils/ingredientUtils.js";

/** A category's colour, from the same code as recipes: "Dessert" is always pink. */
export function catColor(name = "") {
  const hit = wordColors.find((wc) => name.match(wc.matcher));
  return hit ? hit.color : null;
}

/** A text block's HTML with ingredient mentions marked up. Never throws on odd data. */
export function markIngredients(html, ingredients) {
  try { return parseIngredients(html ?? "", ingredients ?? []); } catch { return html ?? ""; }
}

export function flattenIngs(list = [], out = []) {
  for (const i of list ?? []) {
    if (i?.ingredients) flattenIngs(i.ingredients, out);
    else if (i) out.push(i);
  }
  return out;
}

export function totalSeconds(r) {
  const t = (r.times ?? []).filter((x) => x.seconds);
  if (!t.length) return 0;
  return Math.max(...t.map((x) => x.seconds));
}
export function fmtTime(sec) {
  if (!sec) return "";
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}
export function fmtAmount(n) {
  if (n == null || Number.isNaN(n)) return "";
  const fr = [[1 / 8, "⅛"], [1 / 4, "¼"], [1 / 3, "⅓"], [3 / 8, "⅜"], [1 / 2, "½"], [5 / 8, "⅝"], [2 / 3, "⅔"], [3 / 4, "¾"], [7 / 8, "⅞"]];
  const whole = Math.floor(n + 0.02), frac = n - whole;
  if (n < 0.1) return String(Math.round(n * 100) / 100);
  for (const [v, s] of fr) if (Math.abs(frac - v) < 0.03) return (whole ? whole : "") + s;
  if (Math.abs(frac) < 0.03 || Math.abs(frac - 1) < 0.03) return String(Math.round(n));
  return String(Math.round(n * 100) / 100);
}

const text = (html) => (html ?? "").replace(/<[^>]*>/g, " ");
/** A stored recipe, with what the screens need worked out once. */
export function prepare(r) {
  const flat = flattenIngs(r.ingredients);
  return {
    ...r,
    title: r.title || "(untitled)",
    cats: (r.categories ?? []).map((c) => c?.name).filter(Boolean),
    // For a one-line summary: short, real categories only (old imports carry
    // a whole pile of words as one ALL-CAPS "category").
    tidyCats: [...new Set((r.categories ?? []).map((c) => c?.name).filter((n) => n && n.length <= 24 && !(n.length > 12 && n === n.toUpperCase())))],
    seconds: totalSeconds(r),
    flat,
    ingText: flat.map((i) => i.text ?? "").join(" ").toLowerCase(),
    bodyText: (r.text ?? []).map((t) => text(t?.body)).join(" ").toLowerCase(),
    color: getColor(r),
    image: (r.images ?? []).map((im) => im?.thumbnailUrl || im?.url).find((u) => typeof u === "string" && u.startsWith("data:image")) ?? null,
    photo: (r.images ?? []).map((im) => im?.url).find((u) => typeof u === "string" && u.startsWith("data:image")) ?? null,
  };
}
export const isRecipe = (r) => r && !r.deleted && !r.isShoppingList && !/^shopping list$/i.test(r.title ?? "");
export const categoriesOf = (list) => [...new Set(list.flatMap((r) => r.cats))].sort((a, b) => a.localeCompare(b));
export const stars = (n) => (n ? "★".repeat(Math.max(1, Math.round(n / 2))) : "");
export { text };

// The per-recipe colour as an app-defined Contain role: its pair and its pins,
// written where the role is applied (a pin at :root cannot see --recipe-fg).
export const recipeRole = (c) =>
  `--recipe-bg: ${c.bg}; --recipe-fg: ${c.fg}; --recipe-color: ${c.bg}; ` +
  `--on-recipe-link-text-fg: ${c.fg}; --on-recipe-link-hover-text-fg: ${c.fg}; --on-recipe-heading-fg: ${c.fg};`;
export const roleStyle = (c, prefix) => recipeRole(c) + " " + surfaceVars("recipe", prefix);

const startsWord = (hay, term) => new RegExp(`(^|[^\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "u").test(hay);

/**
   One search box over everything. Every word must match somewhere; where it
   matches decides the order: a recipe called "Sugar Cookies" comes before one
   tagged with the word, which comes before one that merely uses sugar.
   Returns [{recipe, score, cats, ingredient, inText}], best first.
*/
export function search(list, query) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return list.map((recipe) => ({ recipe, score: 0, cats: [], ingredient: null, inText: false }));
  const out = [];
  for (const recipe of list) {
    const title = recipe.title.toLowerCase();
    let score = 0, ok = true, ingredient = null, inText = false;
    const cats = new Set();
    for (const term of terms) {
      let best = 0;
      if (title.includes(term)) best = startsWord(title, term) ? 100 : 70;
      for (const c of recipe.cats) {
        const lc = c.toLowerCase();
        if (!lc.includes(term)) continue;
        cats.add(c);
        best = Math.max(best, lc === term ? 65 : startsWord(lc, term) ? 55 : 45);
      }
      if (best < 30) {
        const hit = recipe.flat.find((i) => (i.text ?? "").toLowerCase().includes(term));
        if (hit) { best = Math.max(best, 30); ingredient ??= hit.text; }
      }
      if (!best && recipe.bodyText.includes(term)) { best = 8; inText = true; }
      if (!best) { ok = false; break; }
      score += best;
    }
    if (ok) out.push({ recipe, score, cats: [...cats], ingredient, inText });
  }
  return out;
}
