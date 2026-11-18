// DRY RUN ONLY. Reads a dump and reports how the bare-item extractor
// (src/utils/bareItem.js) compares with the old getShopItem and with the keys
// already stored on ingredients (`ingkey` from the desktop app, `shopItem`).
// Opens no database connection and writes nothing except the optional
// --details file. It does NOT fill shopItem on stored recipes: that would be
// a maintenance pass over the one real database (AGENTS.md rule 2).
//
//   node scripts/bare-item-dry-run.mjs ~/gourmet-dumps/<run>/Gourmet
//   node scripts/bare-item-dry-run.mjs <dump dir | recipes.jsonl> --details out.jsonl
//
// The summary is counts only. --details writes one JSON line per stored key
// that bareItem does not reproduce (text, stored key, bareItem): it contains
// recipe text, so keep it out of the repository.
import fs from 'node:fs';
import path from 'node:path';
import { bareItem, bareItemKey } from '../src/utils/bareItem.js';
import { getShopItem } from '../src/utils/ingredientUtils.js';

const args = process.argv.slice(2);
const detailsAt = args.includes('--details') ? args[args.indexOf('--details') + 1] : null;
const input = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--details');
if (!input) {
    console.error('Usage: bare-item-dry-run.mjs <dump dir | recipes.jsonl> [--details file.jsonl]');
    process.exit(2);
}
const file = fs.statSync(input).isDirectory() ? path.join(input, 'recipes.jsonl') : input;
const log = console.log;
console.log = () => {}; // kept code logs debug lines

const ings = [];
const walk = (list) => {
    if (!Array.isArray(list)) { return; }
    for (const i of list) {
        if (i && Array.isArray(i.ingredients)) { walk(i.ingredients); } else if (i && typeof i === 'object') { ings.push(i); }
    }
};
const recipes = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
recipes.forEach((r) => walk(r.ingredients));

const oldItems = new Set();
const oldItemsCi = new Set();
const newItems = new Set();
const newKeys = new Set();
let empty = 0;
let withText = 0;
for (const i of ings) {
    if (typeof i.text !== 'string' || !i.text.trim()) { continue; }
    withText++;
    const old = getShopItem({ text: i.text });
    oldItems.add(old);
    oldItemsCi.add(old.toLowerCase());
    const b = bareItem(i.text);
    if (!b) { empty++; continue; }
    newItems.add(b);
    newKeys.add(bareItemKey(b));
}

const details = [];
function compare(field) {
    const stored = ings.filter((i) => typeof i[field] === 'string' && i[field].trim() && typeof i.text === 'string');
    let exact = 0; let sameKey = 0; let oldExact = 0; let oldKey = 0;
    for (const i of stored) {
        const want = i[field].trim();
        const b = bareItem(i.text);
        const old = getShopItem({ text: i.text });
        if (b === want.toLowerCase()) { exact++; }
        if (bareItemKey(b) === bareItemKey(want)) { sameKey++; } else { details.push(JSON.stringify({ field, text: i.text, stored: want, bareItem: b })); }
        if (old.toLowerCase() === want.toLowerCase()) { oldExact++; }
        if (bareItemKey(old) === bareItemKey(want)) { oldKey++; }
    }
    return { stored: stored.length, bareItemExact: exact, bareItemSameKey: sameKey, getShopItemExact: oldExact, getShopItemSameKey: oldKey };
}

log(JSON.stringify({
    recipes: recipes.length,
    ingredients: ings.length,
    ingredientsWithText: withText,
    distinct: {
        getShopItem: oldItems.size,
        getShopItemIgnoringCase: oldItemsCi.size,
        bareItem: newItems.size,
        bareItemKey: newKeys.size,
    },
    bareItemEmpty: empty,
    ingkey: compare('ingkey'),
    shopItem: compare('shopItem'),
}, null, 2));
if (detailsAt) { fs.writeFileSync(detailsAt, details.join('\n') + '\n'); }
