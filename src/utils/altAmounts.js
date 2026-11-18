/**
   altAmounts.js

   Second measures on an ingredient ("2 sticks (225 g) butter"). Design and
   open questions: docs/modernization/multiple-measures.md (card R5-1).

   An ingredient has one primary `amount` and optionally `altAmounts`, a list
   of further measures of the same quantity, each shaped like `amount`:

     { amount, rangeAmount?, textAmount?, textRangeAmount?, unit, standardUnit? }

   This file only *finds* extra measures in text. It is deliberately shy: a
   parenthetical becomes a measure only when the whole of it is a number (or
   range) plus ONE unit we know to be a mass, a volume or a butter stick.
   Anything else ("(optional)", "(about 3 lemons)", "(14 oz can)", "(1 large)")
   stays in the text exactly as written. The guarded cases are pinned in
   altAmounts.test.js.
**/

import { parseAmount } from './numbers.js';
import { UNIT_LOOKUP, toGrams, toMilliliters } from './unitAmounts.js';

// Words that mean the parenthetical describes the *size of the container*
// that follows it ("1 (14 oz) can tomatoes"), not a second measure.
const CONTAINER = '(?:cans?|packages?|pkgs?\\.?|packs?|packets?|jars?|boxe?s?|bags?|bottles?|cartons?|containers?|tins?|tubs?|tubes?|pouch(?:es)?|envelopes?)';
const CONTAINER_NEXT = new RegExp('^\\s*' + CONTAINER + '\\b', 'i');

// Primary units that make a parenthetical a container size rather than an
// alternate measure ("1 can (14 oz) tomatoes", "2 large (8 oz) potatoes").
// Unknown unit words are treated the same way: we only attach a second
// measure when we understand the first.
const FINE_PRIMARY_COUNT_UNITS = ['each', 'whole', 'clove', 'head', 'slice', 'bunch', 'stick', 'square'];

const STICK = /^sticks?$/i;

// Look up a unit's standard name. Gourmet's own lookup is case-sensitive
// ('mL' and 'L' are not found); fall back to lower case for those, without
// touching getStandardUnit, so 'T' (tablespoon) is still found first.
function standardUnitOf(unit) {
    if (!unit) { return undefined; }
    return UNIT_LOOKUP[unit] || UNIT_LOOKUP[unit.toLowerCase()];
}

function isMeasureUnit(standardUnit) {
    return Boolean(standardUnit && (toGrams[standardUnit] || toMilliliters[standardUnit]));
}

/**
   Parse a string that is *entirely* one measure: '225 g', '2 1/2 sticks',
   '1-2 Tbsp.'. Returns an amount object, or null if the string is anything
   else (extra words, unknown unit, no number, zero).
**/
export function parseMeasure(text) {
    if (typeof text !== 'string') { return null; }
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 30) { return null; }
    const parsed = parseAmount(trimmed);
    if (parsed.amount === undefined || !(parsed.amount > 0)) { return null; }
    if ((parsed.pretext || '').trim()) { return null; }
    const rest = (parsed.posttext || '').trim().replace(/\.$/, '').trim();
    if (!rest) { return null; }
    let unit;
    let standardUnit;
    if (STICK.test(rest)) {
        unit = rest;
    } else {
        standardUnit = standardUnitOf(rest);
        if (!isMeasureUnit(standardUnit)) { return null; }
        unit = rest;
    }
    const amount = { amount: parsed.amount };
    if (parsed.rangeAmount !== undefined) {
        amount.rangeAmount = parsed.rangeAmount;
    }
    if (parsed.textAmount) { amount.textAmount = parsed.textAmount; }
    if (parsed.textRangeAmount) { amount.textRangeAmount = parsed.textRangeAmount; }
    amount.unit = unit;
    if (standardUnit) { amount.standardUnit = standardUnit; }
    return amount;
}

/**
   May this primary amount carry a second measure? Yes for no unit at all
   ('1 onion (150 g)'), mass, volume, sticks and a few count words; no for
   containers and sizes ('1 can (14 oz)'), and for units we do not know.
**/
export function primaryAllowsAlt(primary) {
    if (!primary || typeof primary !== 'object') { return true; }
    const unit = typeof primary.unit === 'string' ? primary.unit.trim() : '';
    if (!unit) { return true; }
    if (STICK.test(unit)) { return true; }
    const standard = primary.standardUnit || standardUnitOf(unit);
    if (!standard) { return false; }
    return isMeasureUnit(standard) || FINE_PRIMARY_COUNT_UNITS.includes(standard);
}

/**
   Find every parenthetical in `text` that is a clean extra measure. Returns
   { text, altAmounts } with those parentheticals removed from the text, or
   null when there are none. Does not look at the primary amount.
**/
export function findMeasureParens(text) {
    if (typeof text !== 'string' || text.indexOf('(') === -1) { return null; }
    const altAmounts = [];
    let out = '';
    let last = 0;
    const re = /\(([^()]*)\)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        const measure = parseMeasure(m[1]);
        if (!measure) { continue; }
        // '(14 oz) can tomatoes': a size, not a second measure.
        if (CONTAINER_NEXT.test(text.slice(m.index + m[0].length))) { continue; }
        altAmounts.push(measure);
        out += text.slice(last, m.index) + ' ';
        last = m.index + m[0].length;
    }
    if (!altAmounts.length) { return null; }
    out += text.slice(last);
    out = out
        .replace(/\s+([,;.])/g, '$1')   // 'butter , softened' -> 'butter, softened'
        .replace(/^[\s,;.]+/, '')       // a leading paren leaves a stray comma
        .replace(/\s{2,}/g, ' ')
        .trim();
    return { text: out, altAmounts };
}

/**
   '2 cups / 240 g flour' -> '2 cups (240 g) flour', so the one paren rule
   covers both. Only a slash that follows a complete measure (not the slash in
   '1/2'), only when the second thing is a clean measure, and only the first
   such slash. Returns the rewritten text, or the text unchanged.
**/
export function slashToParen(text) {
    if (typeof text !== 'string' || text.indexOf('/') === -1) { return text; }
    for (let i = text.indexOf('/'); i !== -1; i = text.indexOf('/', i + 1)) {
        const before = text.slice(0, i).trim();
        if (!/[A-Za-z.]$/.test(before)) { continue; }   // '1/2' etc.
        if (!parseMeasure(before)) { continue; }
        const after = text.slice(i + 1).trimStart();
        const m = after.match(/^([\d½¼¾⅓⅔][\d\s/.½¼¾⅓⅔–-]*?)\s*([A-Za-z]+\.?)(?=\s|,|$)/);
        if (!m) { continue; }
        const measureText = `${m[1].trim()} ${m[2]}`;
        if (!parseMeasure(measureText)) { continue; }
        const rest = after.slice(m[0].length);
        return `${before} (${measureText})${rest}`;
    }
    return text;
}
