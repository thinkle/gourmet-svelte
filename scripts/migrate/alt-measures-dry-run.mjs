// DRY RUN ONLY (card R5-1). Reads a dump file and reports which stored
// ingredients the multiple-measures parser would change. It opens no database
// connection and writes nothing except the optional --details file.
//
//   node scripts/migrate/alt-measures-dry-run.mjs ~/gourmet-dumps/<run>/Gourmet
//   node scripts/migrate/alt-measures-dry-run.mjs <dump dir or recipes.jsonl> --details changes.jsonl
//
// The summary is counts only. --details writes one JSON line per change
// (recipe id, position, text before, text after, the measure pulled out):
// that file contains recipe text, so keep it out of the repository.
//
// Actually applying a change is a separate script that does not exist yet:
// it needs a fresh dump first (AGENTS.md rule 2) and Tom to run it.
import fs from 'node:fs';
import path from 'node:path';
import { reparseAltAmounts } from '../../src/utils/ingredientParsing.js';
import { safeReparse } from './alt-guard.mjs';

const args = process.argv.slice(2);
const detailsAt = args.includes('--details') ? args[args.indexOf('--details') + 1] : null;
const input = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--details');
if (!input) {
    console.error('Usage: alt-measures-dry-run.mjs <dump dir | recipes.jsonl> [--details file.jsonl]');
    process.exit(2);
}
const file = fs.statSync(input).isDirectory() ? path.join(input, 'recipes.jsonl') : input;

// The parser logs debug lines from kept code (textUtils.js); keep the report readable.
const log = console.log;
console.log = () => {};

const recipes = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
const detailLines = [];
const stats = {
    recipes: recipes.length, recipesChanged: 0, ingredients: 0, withParenthesis: 0,
    changed: 0, byAltUnit: {}, byPrimaryUnit: {}, twoOrMoreAlts: 0, skipped: {},
};
const bump = (o, k) => { o[k] = (o[k] || 0) + 1; };

function walk(list, where, recipeId, state) {
    if (!Array.isArray(list)) { return; }
    list.forEach((ing, i) => {
        if (!ing || typeof ing !== 'object') { return; }
        const at = `${where}[${i}]`;
        if (Array.isArray(ing.ingredients)) { walk(ing.ingredients, at, recipeId, state); return; }
        stats.ingredients++;
        if (/\(.*\)/.test(String(ing.text || ''))) { stats.withParenthesis++; }
        const res = safeReparse(reparseAltAmounts, ing);
        if (res.skipped) {
            bump(stats.skipped, res.skipped);
            detailLines.push(JSON.stringify({ recipe: recipeId, at, skipped: res.skipped, from: ing.text }));
            return;
        }
        const fixed = res.fixed;
        if (!fixed) { return; }
        stats.changed++;
        state.changed = true;
        if (fixed.altAmounts.length > 1) { stats.twoOrMoreAlts++; }
        bump(stats.byPrimaryUnit, (ing.amount && (ing.amount.standardUnit || ing.amount.unit)) || '(count only)');
        for (const a of fixed.altAmounts) { bump(stats.byAltUnit, a.standardUnit || a.unit); }
        detailLines.push(JSON.stringify({
            recipe: recipeId, at, from: ing.text, to: fixed.text,
            altAmounts: fixed.altAmounts,
        }));
    });
}

for (const r of recipes) {
    const state = { changed: false };
    walk(r.ingredients, '', r.id || r.localid || (r._id && (r._id.$oid || String(r._id))), state);
    if (state.changed) { stats.recipesChanged++; }
}

console.log = log;
console.log(JSON.stringify(stats, null, 2));
if (detailsAt) {
    fs.writeFileSync(detailsAt, detailLines.join('\n') + (detailLines.length ? '\n' : ''));
    console.log(`Wrote ${detailLines.length} changes to ${detailsAt}`);
}
console.log('Dry run: nothing was written to any database.');
