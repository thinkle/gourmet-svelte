/**
   ingredientParsing.js

   One canonical place to turn loosely-shaped ingredient input into the
   shape the rest of Gourmet expects. The recipe editor parses ingredient
   text in the browser (see widgets/inputs/IngredientInput.svelte); API and
   MCP clients don't run that code, so they need the same parsing on the
   server side.

   The canonical ingredient looks like this:

     {
       text : 'flour, sifted',        // the ingredient *name* only, no amount
       amount : {
         amount : 1.5,                // number (upper bound when it's a range)
         rangeAmount : 1,             // optional lower bound of a range
         unit : 'cups',
         standardUnit : 'c.',         // filled in for units we know how to convert
       },
       altAmounts : [                 // optional: further measures of the same
         { amount : 240, unit : 'g', standardUnit : 'g' }, // quantity (R5)
       ],
       originalText : '1-1 1/2 cups flour, sifted', // only when we parsed from text
     }

   A group (sub-list) looks like this:

     { text : 'FOR THE DOUGH:', ingredients : [ ...canonical ingredients... ] }

   What we accept as *input* is deliberately generous:

   - a plain string: '1 1/2 cups flour' -> parsed into amount/unit/text
   - {amount, unit, ingredient} (the shape we ask API/MCP clients for)
     where amount may be a number ('2') or a string ('1 1/2', '2-3', 'two')
   - {text} alone -> we parse the text, since that's all we were given
   - {text, amount:{...}} -> already canonical, left alone
   - {text, ingredients:[...]} -> a group, normalized recursively
**/

import { parseAmount, fracToFloat } from './numbers.js';
import { parseUnit, getStandardUnit } from './unitAmounts.js';
import { cleanupWhitespace } from './textUtils.js';
import { findMeasureParens, parseMeasure, primaryAllowsAlt, slashToParen } from './altAmounts.js';

// Keys we'll accept for the ingredient name, in order of preference. `text`
// is our own canonical key; the rest are what an LLM tends to reach for.
const NAME_KEYS = ['ingredient', 'item', 'food', 'name', 'text'];
// Same idea for the numeric quantity.
const AMOUNT_KEYS = ['amount', 'quantity', 'qty'];

function firstDefined(object, keys) {
    for (const key of keys) {
        if (object[key] !== undefined && object[key] !== null && object[key] !== '') {
            return object[key];
        }
    }
    return undefined;
}

function toNumber(value) {
    if (typeof value === 'number') {
        return isNaN(value) ? undefined : value;
    }
    if (typeof value === 'string') {
        const n = fracToFloat(value);
        return typeof n === 'number' && !isNaN(n) ? n : undefined;
    }
    return undefined;
}

function cleanText(value) {
    if (value === undefined || value === null) { return ''; }
    return cleanupWhitespace(String(value));
}

// Take the loose pile of amount-ish properties we've gathered and produce a
// canonical amount object (or undefined if there's nothing worth keeping).
function finishAmount(raw) {
    if (!raw) { return undefined; }
    const amount = {};
    const value = toNumber(raw.amount);
    const rangeValue = toNumber(raw.rangeAmount);
    if (value !== undefined) { amount.amount = value; }
    if (rangeValue !== undefined) { amount.rangeAmount = rangeValue; }
    // Gourmet stores ranges as rangeAmount–amount (low then high). Callers
    // naturally write amount:2, rangeAmount:3 for "2 to 3", so put them back
    // in the order formatAmount expects rather than printing "3–2".
    if (amount.amount !== undefined && amount.rangeAmount !== undefined
        && amount.rangeAmount > amount.amount) {
        const low = amount.amount;
        amount.amount = amount.rangeAmount;
        amount.rangeAmount = low;
    }
    if (raw.textAmount) { amount.textAmount = raw.textAmount; }
    if (raw.textRangeAmount) { amount.textRangeAmount = raw.textRangeAmount; }
    const unit = cleanText(raw.unit);
    if (unit) {
        amount.unit = unit;
        const standardUnit = raw.standardUnit || getStandardUnit(unit);
        if (standardUnit) { amount.standardUnit = standardUnit; }
    }
    if (amount.amount === undefined && amount.rangeAmount === undefined && !amount.unit) {
        return undefined;
    }
    return amount;
}

/**
   Parse a single line of ingredient text ('1 1/2 cups flour, sifted') into a
   canonical ingredient. This is the same split the editor does: find the
   amount first, then look for a unit in whatever is left over.
**/
export function parseIngredientText(rawText) {
    const text = cleanText(rawText);
    if (!text) { return { text: '' }; }
    return parseWithAltAmounts(text) || parsePlainIngredientText(text);
}

// '240 g (2 cups) flour', 'flour (2 cups)', '2 cups / 240 g flour': the
// extra measure becomes altAmounts and leaves the name. Returns undefined
// when the line has no clean extra measure (or its first measure is a
// container: '1 can (14 oz) tomatoes'), so the caller parses as it always did.
function parseWithAltAmounts(text) {
    const found = findMeasureParens(slashToParen(text));
    if (!found || !found.text) { return undefined; }
    const inner = parsePlainIngredientText(found.text);
    if (inner.amount) {
        if (!primaryAllowsAlt(inner.amount)) { return undefined; }
        return { ...inner, originalText: text, altAmounts: found.altAmounts };
    }
    // Nothing but the parenthetical carried a measure ('flour (2 cups)'):
    // the first one is the primary amount.
    const [primary, ...alts] = found.altAmounts;
    const result = { text: inner.text, originalText: text, amount: finishAmount(primary) };
    if (alts.length) { result.altAmounts = alts.map(finishAmount); }
    return result;
}

// The original line parser, unchanged.
function parsePlainIngredientText(text) {
    const parsedAmount = parseAmount(text);
    // true means "require an ingredient": if the leftover text is *only* a
    // unit ('2 eggs'), treat the word as the ingredient rather than the unit.
    const unitAndText = parseUnit(parsedAmount.posttext || parsedAmount.pretext || '', true);
    const ingredient = {
        text: cleanText(unitAndText.text) || text,
        originalText: text,
    };
    const amount = finishAmount({
        amount: parsedAmount.amount,
        rangeAmount: parsedAmount.rangeAmount,
        textAmount: parsedAmount.textAmount,
        textRangeAmount: parsedAmount.textRangeAmount,
        unit: unitAndText.unit,
        standardUnit: unitAndText.standardUnit,
    });
    if (amount) { ingredient.amount = amount; }
    return ingredient;
}

// An amount handed to us as {amount, unit} rather than as free text. The
// amount itself may still be a string ('1 1/2', '2-3', 'a couple'), and the
// unit may still be hiding inside it ('2 cups' with no separate unit field).
function parseStructuredAmount(rawAmount, rawUnit, rawRangeAmount) {
    let unit = rawUnit;
    let collected = { unit, rangeAmount: rawRangeAmount };
    if (rawAmount && typeof rawAmount === 'object') {
        // Already an amount object -- trust it, but let an outer unit win if
        // the object didn't carry one.
        return finishAmount({
            ...rawAmount,
            unit: cleanText(rawAmount.unit) || unit,
            rangeAmount: rawAmount.rangeAmount !== undefined ? rawAmount.rangeAmount : rawRangeAmount,
        });
    }
    if (typeof rawAmount === 'number') {
        collected.amount = rawAmount;
    } else if (typeof rawAmount === 'string' && rawAmount.trim()) {
        const parsed = parseAmount(rawAmount);
        collected.amount = parsed.amount;
        if (parsed.rangeAmount !== undefined) { collected.rangeAmount = parsed.rangeAmount; }
        collected.textAmount = parsed.textAmount;
        collected.textRangeAmount = parsed.textRangeAmount;
        if (!cleanText(unit)) {
            // '2 cups' arrived as the amount with no unit field of its own.
            const leftover = parsed.posttext || parsed.pretext || '';
            const unitMatch = parseUnit(leftover);
            if (unitMatch.unit) {
                collected.unit = unitMatch.unit;
                collected.standardUnit = unitMatch.standardUnit;
            }
        }
    }
    return finishAmount(collected);
}

// altAmounts as a caller may send it: an array of {amount, unit, rangeAmount}
// objects or of strings ('225 g'). Returns undefined when the caller did not
// send the field at all, otherwise a (possibly empty) array of canonical
// amounts: an explicit [] means "no extra measures, do not look in the text".
function normalizeAltAmounts(raw) {
    if (raw === undefined || raw === null) { return undefined; }
    const list = Array.isArray(raw) ? raw : [raw];
    return list.map((item) => {
        // A string must be one clean measure ('225 g'); 'a lot' is dropped.
        if (typeof item === 'string') { return parseMeasure(item) || undefined; }
        if (item && typeof item === 'object') {
            return parseStructuredAmount(item.amount !== undefined ? item.amount : item.quantity,
                                         item.unit, item.rangeAmount);
        }
        return undefined;
    }).filter(Boolean);
}

// Pull clean extra measures out of the text of an ingredient that already has
// its primary amount. Returns {text, altAmounts} or null.
export function extractAltAmounts(text, primary) {
    if (!primaryAllowsAlt(primary)) { return null; }
    const found = findMeasureParens(slashToParen(cleanText(text)));
    if (!found || !found.text) { return null; }
    return found;
}

/**
   Normalize one ingredient entry (string, object, or group) into the
   canonical shape. Returns null for entries with nothing in them.
**/
export function normalizeIngredient(entry) {
    if (entry === undefined || entry === null) { return null; }
    if (typeof entry === 'string' || typeof entry === 'number') {
        const parsed = parseIngredientText(entry);
        return parsed.text ? parsed : null;
    }
    if (typeof entry !== 'object') { return null; }

    // A group: keep the header text as-is (it's a label, not an ingredient)
    // and normalize the sub-list.
    if (Array.isArray(entry.ingredients)) {
        const { ingredients, ...rest } = entry;
        return {
            ...rest,
            text: cleanText(firstDefined(entry, ['text', 'name', 'header', 'group', 'title'])),
            ingredients: normalizeIngredients(ingredients),
        };
    }

    const {
        text, ingredient, item, food, name,
        amount, quantity, qty, unit, rangeAmount,
        altAmounts,
        ...rest
    } = entry;
    // Explicit altAmounts from the caller win over anything in the text.
    const explicitAlts = normalizeAltAmounts(altAmounts);
    const rawName = firstDefined(entry, NAME_KEYS);
    const rawAmount = firstDefined(entry, AMOUNT_KEYS);
    const hasStructure = rawAmount !== undefined
        || (unit !== undefined && unit !== null && unit !== '')
        || rangeAmount !== undefined;

    if (!hasStructure) {
        // All we were given is a name, so it may well be a whole ingredient
        // line ('2 cups flour'). Parse it.
        const parsed = explicitAlts
            ? parsePlainIngredientText(cleanText(rawName))
            : parseIngredientText(rawName);
        if (!parsed.text) { return null; }
        const result = { ...rest, ...parsed };
        if (explicitAlts && explicitAlts.length) { result.altAmounts = explicitAlts; }
        return result;
    }

    const normalized = { ...rest, text: cleanText(rawName) };
    const parsedAmount = parseStructuredAmount(rawAmount, unit, rangeAmount);
    if (parsedAmount) { normalized.amount = parsedAmount; }
    if (explicitAlts) {
        if (explicitAlts.length) { normalized.altAmounts = explicitAlts; }
    } else if (parsedAmount) {
        // {amount:285, unit:'g', ingredient:'butter (2 1/2 sticks)'}
        const found = extractAltAmounts(normalized.text, parsedAmount);
        if (found) {
            normalized.originalText = rest.originalText || normalized.text;
            normalized.text = found.text;
            normalized.altAmounts = found.altAmounts;
        }
    }
    if (!normalized.text && !normalized.amount) { return null; }
    return normalized;
}

/**
   Normalize a whole ingredient list. Accepts a single string (split on
   newlines) as a convenience, since that's a common way to paste a list.
**/
export function normalizeIngredients(list) {
    if (!list) { return []; }
    if (typeof list === 'string') {
        list = list.split(/\r?\n/);
    }
    if (!Array.isArray(list)) { return []; }
    return list.map(normalizeIngredient).filter(Boolean);
}

// ---------------------------------------------------------------------------
// Repairing ingredients that were stored before the server parsed anything.
// ---------------------------------------------------------------------------

// An ingredient already has an amount worth keeping if it carries a number or
// a unit. An empty {} doesn't count.
function hasUsableAmount(ingredient) {
    const amount = ingredient && ingredient.amount;
    if (!amount || typeof amount !== 'object') { return false; }
    return typeof amount.amount === 'number'
        || typeof amount.rangeAmount === 'number'
        || Boolean(amount.unit);
}

/**
   Decide whether a stored ingredient looks like an unparsed line of text
   ({text: '250g all-purpose flour'}) and, if so, return the repaired version.
   Returns null when we should leave it alone.

   This runs unattended over the whole collection, so it is deliberately shy:
   anything the least bit odd is skipped rather than guessed at. The cost of
   skipping is an ingredient that stays as it is; the cost of guessing wrong
   is a mangled recipe.
**/
export function reparseIngredient(ingredient) {
    if (!ingredient || typeof ingredient !== 'object') { return null; }
    if (Array.isArray(ingredient.ingredients)) { return null; } // a group heading
    if (hasUsableAmount(ingredient)) { return null; }
    const text = cleanText(ingredient.text);
    if (!text) { return null; }

    const parsed = parseIngredientText(text);
    if (!parsed.amount) { return null; }
    // A zero amount means we matched something like '00 flour'.
    if (!parsed.amount.amount && !parsed.amount.rangeAmount) { return null; }
    // If pulling the number out strands punctuation at the front ('2% milk'
    // -> '% milk', '7-Up' -> '-Up') we misread a name as an amount.
    if (!/^[\p{L}\p{N}]/u.test(parsed.text)) { return null; }
    // Nothing actually moved out of the name.
    if (parsed.text === text) { return null; }

    return { ...ingredient, ...parsed };
}

/**
   Walk a stored ingredient list (including groups) and repair what we can.
   Returns the new list plus a description of every change, so a caller can
   show its work before writing anything.
**/
export function reparseIngredients(list, path = '') {
    if (!Array.isArray(list)) { return { ingredients: list, changes: [] }; }
    const changes = [];
    const ingredients = list.map((ingredient, index) => {
        const where = path ? `${path}[${index}]` : `[${index}]`;
        if (ingredient && Array.isArray(ingredient.ingredients)) {
            const nested = reparseIngredients(ingredient.ingredients, where);
            changes.push(...nested.changes);
            return { ...ingredient, ingredients: nested.ingredients };
        }
        const repaired = reparseIngredient(ingredient);
        if (!repaired) { return ingredient; }
        changes.push({
            at: where,
            from: ingredient.text,
            to: {
                text: repaired.text,
                amount: repaired.amount.amount,
                rangeAmount: repaired.amount.rangeAmount,
                unit: repaired.amount.unit,
            },
        });
        return repaired;
    });
    return { ingredients, changes };
}

/**
   The maintenance counterpart for stored ingredients that already have a
   primary amount and a second measure written into the text
   ({amount:{285,'g'}, text:'butter (2 1/2 sticks)'}). Returns the repaired
   ingredient, or null to leave it alone. Never runs by itself: the dry-run
   script (scripts/migrate/alt-measures-dry-run.mjs) reports what it would do.
**/
export function reparseAltAmounts(ingredient) {
    if (!ingredient || typeof ingredient !== 'object') { return null; }
    if (Array.isArray(ingredient.ingredients)) { return null; }
    if (ingredient.altAmounts !== undefined) { return null; }
    if (!hasUsableAmount(ingredient)) { return null; }
    const found = extractAltAmounts(ingredient.text, ingredient.amount);
    if (!found) { return null; }
    return {
        ...ingredient,
        text: found.text,
        originalText: ingredient.originalText || cleanText(ingredient.text),
        altAmounts: found.altAmounts,
    };
}
