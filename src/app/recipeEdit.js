// Plain helpers for editing one stored recipe. No Svelte here: the
// reactive wrapper is editState.svelte.js.
//
// The rule these follow: reading a recipe for the editor never changes it.
// Odd shapes (ingredients as strings, text as one string, missing arrays) are
// *shown* through the view helpers and only turned into the regular shape by
// `materialize`, which the editor calls the first time the user changes that
// field.
import { floatToFrac } from "../utils/numbers.js";
import { parseIngredientText, normalizeIngredient, normalizeIngredients } from "../utils/ingredientParsing.js";
import { getSecondsFromString } from "../utils/times.js";

export const clone = (x) => (x === undefined ? undefined : structuredClone(x));

/** JSON with sorted keys: two recipes with the same content give the same string. */
export function canonical(value) {
  return JSON.stringify(value, (_key, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = v[k];
      return out;
    }
    return v;
  });
}

export const same = (a, b) => canonical(a) === canonical(b);

/** Top-level fields whose content differs, in a stable order. */
export function changedFields(draft, original) {
  const keys = new Set([...Object.keys(draft ?? {}), ...Object.keys(original ?? {})]);
  return [...keys].filter((k) => !same(draft?.[k], original?.[k])).sort();
}

// ── Reading odd shapes without changing them ─────────────────────────

/** The ingredient list as the editor shows it: always an array. */
export function ingredientsView(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") return value.split(/\r?\n/).filter((l) => l.trim());
  return [];
}

/** The text blocks as the editor shows them: always an array of {header, body}. */
export function textView(value) {
  if (Array.isArray(value)) return value.map((b) => (typeof b === "string" ? { body: b } : b ?? {}));
  if (typeof value === "string") return value ? [{ body: value }] : [];
  return [];
}

/** Any other list field (categories, sources, yields, times). */
export function listView(value, field) {
  if (Array.isArray(value)) return value.map((v) => (typeof v === "string" ? fromString(field, v) : v ?? {}));
  if (typeof value === "string" && value) return [fromString(field, value)];
  return [];
}

function fromString(field, s) {
  if (field === "categories") return { name: s };
  if (field === "sources") return /^https?:/i.test(s) ? { name: "", url: s } : { name: s };
  if (field === "times") return { name: "", text: s, seconds: getSecondsFromString(s) || 0 };
  return { unit: s };
}

/**
   The regular shape for one field, for writing. Returns the value to store
   (which is the same array when it is already regular).
*/
export function materialize(field, value) {
  if (field === "ingredients") {
    if (!Array.isArray(value)) return normalizeIngredients(value);
    if (value.every((i) => i && typeof i === "object")) return value;
    return value.map((i) => (i && typeof i === "object" ? i : normalizeIngredient(i) ?? { text: "" }));
  }
  if (field === "text") {
    if (Array.isArray(value) && value.every((b) => b && typeof b === "object")) return value;
    return textView(value);
  }
  if (Array.isArray(value) && value.every((v) => v && typeof v === "object")) return value;
  return listView(value, field);
}

// ── Ingredient lines ─────────────────────────────────────────────────

const plainFrac = (n) => floatToFrac(n, { unicodeFractions: false });

/** One ingredient as the line of text a cook would type: "1 1/2 cups flour, sifted". */
export function ingredientLine(ing) {
  if (ing == null) return "";
  if (typeof ing !== "object") return String(ing);
  const a = ing.amount;
  const parts = [];
  if (a && typeof a === "object") {
    if (typeof a.amount === "number") {
      parts.push(typeof a.rangeAmount === "number" ? `${plainFrac(a.rangeAmount)}-${plainFrac(a.amount)}` : plainFrac(a.amount));
    }
    if (a.unit) parts.push(a.unit);
  }
  // Second measures ride along in brackets, as they display: "285 g (2 1/2 sticks) butter".
  const alts = (ing.altAmounts ?? [])
    .map((m) => (typeof m?.amount === "number" ? [typeof m.rangeAmount === "number" ? `${plainFrac(m.rangeAmount)}-${plainFrac(m.amount)}` : plainFrac(m.amount), m.unit].filter(Boolean).join(" ") : ""))
    .filter(Boolean);
  if (alts.length) parts.push(...alts.map((t) => `(${t})`));
  if (ing.text) parts.push(ing.text);
  return parts.join(" ");
}

/** What the parser understood, for showing beside the line: {amount, unit, item}. */
export function understood(ing) {
  if (!ing || typeof ing !== "object") return null;
  const a = ing.amount && typeof ing.amount === "object" ? ing.amount : {};
  const amount = typeof a.amount === "number"
    ? (typeof a.rangeAmount === "number" ? `${floatToFrac(a.rangeAmount)}–${floatToFrac(a.amount)}` : floatToFrac(a.amount))
    : "";
  return { amount, unit: a.unit ?? "", item: ing.text ?? "" };
}

// Keys the parser owns; everything else on an ingredient (shopItem,
// reference, optional, …) is the user's and survives a re-parse.
const PARSED_KEYS = ["text", "amount", "originalText", "altAmounts"]; // altAmounts: the typed line says what it is

/** A line the user typed, parsed by Gourmet's own parser, keeping the old ingredient's extras. */
export function parseLine(line, previous) {
  const extras = {};
  if (previous && typeof previous === "object") {
    for (const [k, v] of Object.entries(previous)) if (!PARSED_KEYS.includes(k)) extras[k] = v;
  }
  return { ...extras, ...parseIngredientText(line) };
}

/**
   Re-read lines that were stored with a second measure left in the text
   ("285 g unsalted butter (2 1/2 sticks)"). Changes only lines where the
   parser finds an alternate and the line has none yet. Returns the number
   of lines it would change, and applies `set(path, ingredient)` to each.
*/
export function findSecondUnits(list, set) {
  let n = 0;
  (list ?? []).forEach((ing, i) => {
    if (Array.isArray(ing?.ingredients)) {
      ing.ingredients.forEach((sub, j) => { n += tryLine(sub, [i, j], set); });
    } else n += tryLine(ing, [i], set);
  });
  return n;
}
function tryLine(ing, path, set) {
  if (!ing || typeof ing !== "object" || ing.altAmounts?.length) return 0;
  const next = parseLine(ingredientLine(ing), ing);
  if (!next.altAmounts?.length) return 0;
  set(path, next);
  return 1;
}

// ── Times ────────────────────────────────────────────────────────────

/** A typed duration ("1 hr 15 min") to seconds, or 0 if it does not read as one. */
export function parseDuration(text) {
  try { return getSecondsFromString(String(text ?? "")) || 0; } catch { return 0; }
}

// ── Tidying on save ──────────────────────────────────────────────────

const emptyIng = (i) => !i || (typeof i === "object" && !i.ingredients && !String(i.text ?? "").trim()
  && !(i.amount && (typeof i.amount.amount === "number" || i.amount.unit)));
const EMPTY_ROW = {
  categories: (v) => !v || !String(v.name ?? "").trim(),
  sources: (v) => !v || !(String(v.name ?? "").trim() || String(v.url ?? "").trim()),
  yields: (v) => !v || !(v.amount || v.unit),
  times: (v) => !v || !(v.name || v.text || v.seconds),
  text: (v) => !v || !(String(v.header ?? "").trim() || String(v.body ?? "").trim()),
};

/**
   Drop the blank rows the user left behind (an empty ingredient line, a
   source with nothing in it), but only in fields the user changed: an
   untouched field is saved exactly as it was loaded.
*/
export function tidy(draft, original) {
  const out = clone(draft);
  for (const field of changedFields(draft, original)) {
    const v = out[field];
    if (!Array.isArray(v)) continue;
    if (field === "ingredients") {
      out.ingredients = v.filter((i) => !emptyIng(i)).map((i) => (i?.ingredients ? { ...i, ingredients: i.ingredients.filter((ii) => !emptyIng(ii)) } : i));
    } else if (EMPTY_ROW[field]) {
      out[field] = v.filter((row) => !EMPTY_ROW[field](row));
    }
  }
  return out;
}

/** A new recipe, as the editor starts it. Nothing is written until Save. */
export const blankRecipe = () => ({ title: "", ingredients: [], text: [] });

// ── Moving lines in an ingredient list with groups ───────────────────
//
// A path is [i] for a top-level entry or [g, j] for line j of group g.
// Moving a line past the edge of a group takes it out of the group; moving
// it onto a group from outside puts it in. So up and down alone reach every
// position, which is what makes keyboard reordering enough.

const isGroup = (x) => Boolean(x && typeof x === "object" && Array.isArray(x.ingredients));

/** Move the line at `path` one step (`dir` -1 up, +1 down). Mutates `list`; returns the line's new path. */
export function moveLine(list, path, dir) {
  if (path.length === 1) {
    const [i] = path;
    const j = i + dir;
    if (j < 0 || j >= list.length) return path;
    const [line] = list.splice(i, 1);
    if (!isGroup(line) && isGroup(list[dir < 0 ? j : i])) {
      const group = list[dir < 0 ? j : i];
      if (dir < 0) { group.ingredients.push(line); return [j, group.ingredients.length - 1]; }
      group.ingredients.unshift(line);
      return [i, 0];
    }
    list.splice(j, 0, line);
    return [j];
  }
  const [g, i] = path;
  const inner = list[g].ingredients;
  const j = i + dir;
  if (j >= 0 && j < inner.length) {
    inner.splice(j, 0, inner.splice(i, 1)[0]);
    return [g, j];
  }
  const [line] = inner.splice(i, 1);
  const at = dir < 0 ? g : g + 1;
  list.splice(at, 0, line);
  return [at];
}

/** Insert an empty line after `path` (or at the end of `list` with no path). Returns its path. */
export function insertLine(list, path) {
  const line = { text: "" };
  if (!path) { list.push(line); return [list.length - 1]; }
  if (path.length === 1) {
    // After a group's name: the group's first line.
    if (isGroup(list[path[0]])) { list[path[0]].ingredients.unshift(line); return [path[0], 0]; }
    list.splice(path[0] + 1, 0, line);
    return [path[0] + 1];
  }
  list[path[0]].ingredients.splice(path[1] + 1, 0, line);
  return [path[0], path[1] + 1];
}

/** Remove the line at `path`. Returns the path of the line before it, if any. */
export function removeLine(list, path) {
  if (path.length === 1) {
    list.splice(path[0], 1);
    return path[0] > 0 ? [path[0] - 1] : null;
  }
  list[path[0]].ingredients.splice(path[1], 1);
  return path[1] > 0 ? [path[0], path[1] - 1] : [path[0]];
}

/** Remove group `g`, keeping its lines in its place. */
export function ungroup(list, g) {
  const [group] = list.splice(g, 1);
  list.splice(g, 0, ...group.ingredients);
}

/** Get the entry at a path. */
export const at = (list, path) => (path.length === 1 ? list[path[0]] : list[path[0]]?.ingredients?.[path[1]]);
