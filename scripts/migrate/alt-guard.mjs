// Shared by the alt-measures dry run and apply scripts.
//
// The parser is right about clean lines and wrong about a few odd ones. Rather
// than change it, these scripts leave such lines alone and say why. Reasons:
//
//   alternatives   "(30 mL) ginger or 1 1/2 tsp (7 mL) ground ginger": two measured
//                  alternatives, not two measures of one ingredient.
//   leftover-unit  the text still starts with a unit or container word
//                  ("sticks (1 cup) butter", "cup/225 grams butter (2 sticks)",
//                  "jar (7oz) marshmallow creme", "or 2 shots (3 ounces) ..."):
//                  an older bad parse; stripping the bracket would make it worse.
//   typo           "(21/2 cups)" is "2 1/2" with a missing space; it reads as 10.5.
import { parseMeasure } from '../../src/utils/altAmounts.js';
import { UNIT_LOOKUP } from '../../src/utils/unitAmounts.js';

const CONTAINERS = /^(jars?|cans?|links?|packages?|pkgs?|packs?|packets?|boxe?s?|bags?|bottles?|tubs?|cartons?|tins?)$/i;

function measureParens(text) {
    const out = [];
    const re = /\(([^()]*)\)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
        if (parseMeasure(m[1])) { out.push({ start: m.index, end: m.index + m[0].length, inner: m[1] }); }
    }
    return out;
}

/** Why this line should be left alone, or null if it is fine to re-read. */
export function whySkipped(text) {
    if (typeof text !== 'string') { return null; }
    const t = text.trim();
    const first = (t.match(/^[^\s/(]+/) || [''])[0].replace(/\.$/, '');
    if (/^or\b/i.test(t)) { return 'leftover-unit'; }
    if (first && (CONTAINERS.test(first) || UNIT_LOOKUP[first] || UNIT_LOOKUP[first.toLowerCase()])) {
        // "cup/225 grams ...", "sticks (1 cup) ...", "jar (7oz) ...": a unit word where the name should start.
        return 'leftover-unit';
    }
    const parens = measureParens(t);
    for (let i = 1; i < parens.length; i++) {
        if (/\bor\b/i.test(t.slice(parens[i - 1].end, parens[i].start))) { return 'alternatives'; }
    }
    if (parens.some((p) => /\d\d+\/\d/.test(p.inner) && !/\d\s+\d+\/\d/.test(p.inner))) { return 'typo'; }
    return null;
}

/** reparseAltAmounts, minus the lines we know it gets wrong. Returns {fixed} or {skipped: reason}. */
export function safeReparse(reparse, ing) {
    const fixed = reparse(ing);
    if (!fixed) { return { fixed: null }; }
    const why = whySkipped(ing && ing.text);
    return why ? { skipped: why } : { fixed };
}

/**
   A copy of an ingredient list (groups included) with second measures read
   out of the text where it is safe to. `report({where, from, to, alts})` is
   called for each change and `skip(reason, where, text)` for each line left
   alone. Returns the new list.
**/
export function reparseList(list, reparse, { report = () => {}, skip = () => {} } = {}, where = '') {
    if (!Array.isArray(list)) { return list; }
    return list.map((ing, i) => {
        if (!ing || typeof ing !== 'object') { return ing; }
        const at = `${where}[${i}]`;
        if (Array.isArray(ing.ingredients)) { return { ...ing, ingredients: reparseList(ing.ingredients, reparse, { report, skip }, at) }; }
        const res = safeReparse(reparse, ing);
        if (res.skipped) { skip(res.skipped, at, ing.text); return ing; }
        if (!res.fixed) { return ing; }
        report({ where: at, from: ing.text, to: res.fixed.text, alts: res.fixed.altAmounts });
        return res.fixed;
    });
}
