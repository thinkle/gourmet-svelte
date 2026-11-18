/**
   bareItem.js

   The bare item of an ingredient: what you would write on a shopping list.
   "unsalted butter (2 1/2 sticks)" -> "butter", "large eggs, beaten" -> "eggs",
   "1 (14 oz) can diced tomatoes" -> "diced tomatoes".

   Rules and word lists only: no network, no model, cheap enough to run on
   every API write. Stored as `shopItem` on an ingredient when a client did
   not send one (see src/data/functions/api.js). The kept `getShopItem` in
   ingredientUtils.js still exists for the old screens; this replaces it for
   new code.

   What is dropped, in order:
     1. bracketed asides: "(2 sticks)", "[optional]"
     2. everything after the first comma or semicolon ("eggs, beaten"), and
        after " for ", " to taste", " or ", " such as ", " plus " ...
     3. a leading amount and its unit or container ("1 (14 oz) can", "2 cups",
        "a pinch of")
     4. size, freshness, grade and prep words anywhere ("large", "fresh",
        "unsalted", "all-purpose", "extra-virgin", "chopped", "melted",
        "freshly ground", "boneless") -- except inside a few product names
        ("diced tomatoes", "crushed red pepper", "ground beef")
     5. part words after the item ("garlic cloves" -> "garlic",
        "celery stalks" -> "celery", "thyme sprigs" -> "thyme")

   What is kept: words that change what you buy. "brown sugar", "kosher salt",
   "black pepper", "heavy cream", "whole milk", "dried oregano", "ground
   cinnamon" all stay as they are. Butter loses "unsalted"/"salted" and flour
   loses "all-purpose" on purpose: Tom's own stored keys (`ingkey`) do the
   same, and a shopping list wants one "butter" line, not two.

   The result is lower case and keeps the plural as written ("eggs"), so it
   reads naturally. `bareItemKey` is the form to compare and merge on: plural
   folded to singular, accents and hyphens folded.
**/

// --- word lists ----------------------------------------------------------

// Leading words that are only an amount, a unit or a container. Dropped only
// when something follows them ("cloves" alone is the spice).
const UNIT_WORDS = new Set(`
    cup cups c tablespoon tablespoons tbsp tbsps tbs tb teaspoon teaspoons tsp tsps
    t ounce ounces oz fl fluid lb lbs pound pounds g gram grams kg kilogram kilograms
    mg ml milliliter milliliters millilitre millilitres l liter liters litre litres
    quart quarts qt pint pints pt gallon gallons gal
    pinch pinches dash dashes splash handful handfuls drop drops sprinkle
    can cans tin tins jar jars package packages pkg pkgs pack packs packet packets
    box boxes bag bags bottle bottles carton cartons container containers tub tubs
    envelope envelopes pouch block blocks stick sticks bunch bunches head heads
    clove cloves sprig sprigs stalk stalks rib ribs slice slices piece pieces
    sheet sheets strip strips scoop scoops knob dollop wedge wedges
    inch inches cm
`.trim().split(/\s+/));

// Words dropped wherever they stand: size, grade, freshness, temperature,
// state and prep. Past participles only, never the bare verb or a noun
// ("chops", "peel", "mix", "sprinkles" are things you buy).
const DROP_WORDS = new Set(`
    large small medium big jumbo extra-large x-large xl lg sm med
    fresh freshly good good-quality high-quality quality best organic ripe very
    unsalted salted all-purpose extra-virgin virgin pure lean extra-lean
    boneless skinless bone-in skin-on
    cold warm hot lukewarm boiling chilled cooled warmed tepid iced room-temperature
    softened melted beaten sifted packed firmly lightly loosely well
    chopped minced diced crushed sliced grated shredded halved quartered cubed julienned slivered
    peeled cored seeded pitted stemmed trimmed rinsed drained thawed divided
    mashed pureed puréed crumbled torn zested juiced squeezed separated
    finely thinly roughly coarsely freshly fine coarse thin thick thickly
    about approximately approx generous heaping heaped scant level rounded
    optional additional extra more some few
    store-bought homemade unseasoned fat plump
`.trim().split(/\s+/));

// Leading filler: "a pinch of", "of butter", "the juice".
const FILLER = new Set(['a', 'an', 'of', 'the', 'x']);

// Phrases where a word from DROP_WORDS names the product itself.
const KEEP_PHRASES = [
    /\bdiced tomato(e?s)?\b/,
    /\bcrushed tomato(e?s)?\b/,
    /\bcrushed red pepper\b/,
    /\bground (beef|pork|turkey|chicken|lamb|veal|meat|sausage|bison)\b/,
    /\bchopped (clams|spinach)\b/,
    /\bshredded (coconut|wheat)\b/,
    /\bsliced (almonds|olives)\b/,
    /\bslivered almonds\b/,
    /\bhot (sauce|dogs?|peppers?|chil[ei]s?|chocolate)\b/,
    /\bthin spaghetti\b/,
];

// Herbs whose "leaves" are the herb ("cilantro leaves" -> "cilantro"); not
// bay, curry or lime leaves, which are what you buy.
const LEAFY_HERBS = /^(cilantro|parsley|basil|mint|thyme|sage|oregano|tarragon|dill|rosemary|marjoram|coriander)$/;

// "15-ounce", "8-inch", "3.4-oz": a size, not part of the item.
const SIZE_TOKEN = /^\d+(?:[.,]\d+)?(?:[-–]\d+)?-?(?:ounces?|oz|inch(?:es)?|in|pounds?|lbs?|g|grams?|kg|ml|l|liters?|litres?|cm|quarts?|qt)(?:-[a-z]+)?$/;

const NUMBER_WORDS = new Set(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'dozen']);

// Where the text stops being the item.
const CUT_AT = /\s(?:for|to taste|to serve|or|such as|plus|if needed|as needed|at room temperature|about|preferably|like|e\.g\.|ie|i\.e\.|from|in|with|cut into|into)\b/;

const NUMBER = /^(?:\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?|[¼-¾⅐-⅞]|\d+[¼-¾⅐-⅞])$/;
const RANGE_WORD = new Set(['-', '–', '—', 'to', 'or']);

// --- helpers -------------------------------------------------------------

function stripBrackets(s) {
    let prev;
    do {
        prev = s;
        s = s.replace(/\([^()]*\)|\[[^\[\]]*\]|\{[^{}]*\}/g, ' ');
    } while (s !== prev);
    // An unclosed "(" drops the rest; a stray ")" is just noise.
    return s.replace(/\(.*$/, ' ').replace(/[)\]}]/g, ' ');
}

function isNumberToken(w) {
    return NUMBER.test(w) || SIZE_TOKEN.test(w) || /^\d+(?:[-–]\d+)$/.test(w) || /^\d+[\/⁄]\d+$/.test(w);
}

// Drop "1", "1 1/2", "2-3", "2 to 3", "½" and an "x" from the front.
function dropLeadingAmount(words) {
    let i = 0;
    let found = false;
    while (i < words.length) {
        const w = words[i];
        if (isNumberToken(w) || (NUMBER_WORDS.has(w) && words[i + 1] && !RANGE_WORD.has(words[i + 1]))) { found = true; i++; continue; }
        if (found && RANGE_WORD.has(w) && words[i + 1] && isNumberToken(words[i + 1])) { i++; continue; }
        break;
    }
    return { words: words.slice(i), found };
}

// Drop leading units, containers, sizes and filler ("can", "large",
// "pinch of"), never the last word.
function dropLeadingUnits(words) {
    let i = 0;
    while (i < words.length - 1) {
        const w = words[i];
        if (UNIT_WORDS.has(w) || FILLER.has(w) || isNumberToken(w)) { i++; continue; }
        // "fl. oz", "tbsp."
        if (UNIT_WORDS.has(w.replace(/\.$/, ''))) { i++; continue; }
        break;
    }
    return words.slice(i);
}

// Is words[i] inside a phrase that must be kept whole?
function protectedIndexes(words) {
    const keep = new Set();
    const joined = words.join(' ');
    for (const re of KEEP_PHRASES) {
        const m = joined.match(re);
        if (!m) { continue; }
        const start = joined.slice(0, m.index).split(' ').filter(Boolean).length;
        const len = m[0].split(' ').length;
        for (let k = start; k < start + len; k++) { keep.add(k); }
    }
    return keep;
}

function dropWords(words) {
    const keep = protectedIndexes(words);
    const out = [];
    words.forEach((w, i) => {
        if (keep.has(i)) { out.push(w); return; }
        if (DROP_WORDS.has(w)) { return; }
        // "freshly-grated", "thinly-sliced"
        if (w.includes('-') && w.split('-').every((p) => DROP_WORDS.has(p))) { return; }
        // "freshly ground pepper", "finely ground nutmeg": the grind is prep.
        if (w === 'ground') {
            const prev = words[i - 1];
            const next = words.slice(i + 1).join(' ');
            if (/^(freshly|fresh|finely|coarsely|fine|coarse)$/.test(prev || '') || /^((black|white|pink|green) )?pepper(corns?)?$/.test(next)) {
                return;
            }
        }
        out.push(w);
    });
    return out;
}

// "garlic cloves" -> "garlic", "celery ribs" -> "celery", "thyme sprigs" -> "thyme".
function dropTrailingParts(words) {
    if (words.length < 2) { return words; }
    const last = words[words.length - 1];
    const before = words[words.length - 2];
    if (/^cloves?$/.test(last) && before === 'garlic') { return words.slice(0, -1); }
    if (/^(stalks?|ribs?)$/.test(last) && before === 'celery') { return words.slice(0, -1); }
    if (/^(sprigs?|stalks?)$/.test(last)) { return words.slice(0, -1); }
    if (last === 'leaves' && LEAFY_HERBS.test(before)) { return words.slice(0, -1); }
    return words;
}

// --- the API -------------------------------------------------------------

/**
   The bare item for an ingredient's text (or an ingredient object), lower
   case, or '' when nothing item-like is left ("to taste", "diced").
**/
export function bareItem(input) {
    let text = input && typeof input === 'object' ? (input.text ?? '') : input;
    if (typeof text !== 'string') { return ''; }
    let s = text.normalize('NFC').toLowerCase()
        .replace(/[▢•*•▢]/g, ' ')  // checkbox and bullet glyphs from web pages
        .replace(/[’`]/g, "'")
        .replace(/\ball[\s-]+purpose\b/g, 'all-purpose')
        .replace(/\bextra[\s-]+virgin\b/g, 'extra-virgin')
        .replace(/\bextra[\s-]+large\b/g, 'extra-large')
        .replace(/\bextra[\s-]+lean\b/g, 'extra-lean')
        .replace(/\b(good|high)[\s-]+quality\b/g, '$1-quality')
        .replace(/\bbone[\s-]+in\b/g, 'bone-in')
        .replace(/\bskin[\s-]+on\b/g, 'skin-on')
        .replace(/\bstore[\s-]+bought\b/g, 'store-bought')
        .replace(/\broom[\s-]+temperature\b/g, 'room-temperature');
    s = s.replace(/<[^>]*>/g, ' ');
    s = stripBrackets(s);
    // "boneless, skinless chicken breasts": a first part that is only prep
    // or size words gives way to the next part.
    for (const part of s.split(/[,;:]| -+ | – | — /)) {
        const item = fromPart(part);
        if (item) { return item; }
        if (/\p{L}/u.test(part) && !onlyDropWords(part)) { return ''; }
    }
    return '';
}

function onlyDropWords(part) {
    return part.split(/\s+/).filter(Boolean).every((w) => DROP_WORDS.has(w) || FILLER.has(w) || w === 'and');
}

const NOT_AN_ITEM = /^\s*(to taste|to serve|as needed|if needed|or more|for (serving|garnish|garnishing|dusting|frying|greasing|topping))\b/;

function fromPart(part) {
    let s = part;
    if (NOT_AN_ITEM.test(s)) { return ''; }
    // Cut at " for serving", " or milk", " to taste" -- but not at the very
    // start ("for the sauce" is a heading, not an item; it stays as is).
    const cut = s.match(CUT_AT);
    if (cut && cut.index > 0) {
        const before = s.slice(0, cut.index).trim();
        const after = s.slice(cut.index).trim();
        // "chicken or vegetable broth" -> "chicken broth"
        const alt = after.match(/^or\s+([\p{L}-]+)\s+([\p{L}\s-]+?)\s*$/u);
        const core = before.split(/\s+/).filter((w) => !DROP_WORDS.has(w));
        s = (alt && core.length === 1 && !CUT_AT.test(' ' + alt[2])) ? `${before} ${alt[2]}` : before;
    }
    s = s.replace(/(\d)\s*([a-z])/g, '$1 $2').replace(/(\d) -(ounce|oz|inch|in|pound|lb|g|gram|cm|ml)/g, '$1-$2');
    s = s.replace(/[^\p{L}\p{N}\s'\-\/⁄.&\u00BC-\u00BE\u2150-\u215E]/gu, ' ');
    let words = s.split(/\s+/).map((w) => w.replace(/^[.'-]+|[.'-]+$/g, '')).filter(Boolean);

    const lead = dropLeadingAmount(words);
    words = lead.words;
    words = dropLeadingUnits(words);
    words = dropWords(words);
    // Dropping prep words can expose a leading unit or "of" ("large pinch of").
    words = dropLeadingUnits(words);
    words = dropTrailingParts(words);
    words = words.filter((w) => !isNumberToken(w));
    while (words.length && (FILLER.has(words[words.length - 1]) || words[words.length - 1] === 'and')) { words.pop(); }
    if (words.length === 1 && (FILLER.has(words[0]) || UNIT_WORDS.has(words[0]) && lead.found)) { return ''; }
    if (words.every((w) => FILLER.has(w))) { return ''; }
    return words.join(' ').replace(/\s+/g, ' ').trim();
}

const NOT_PLURAL = new Set([
    'molasses', 'hummus', 'couscous', 'asparagus', 'swiss', 'brussels', 'grits',
    'citrus', 'octopus', 'hibiscus', 'bass', 'grass', 'glass', 'cress', 'watercress',
    'series', 'species', 'bitters', 'schnapps', 'chips', 'oats', 'greens',
    'lemongrass', 'sassafras', 'anise', 'ras', 'harissa', 'dashi',
]);
const IRREGULAR = {
    leaves: 'leaf', halves: 'half', loaves: 'loaf', knives: 'knife', calves: 'calf',
    potatoes: 'potato', tomatoes: 'tomato', mangoes: 'mango', avocados: 'avocado',
    cookies: 'cookie', anchovies: 'anchovy', berries: 'berry', cherries: 'cherry',
    radishes: 'radish', peaches: 'peach', dishes: 'dish', boxes: 'box', cloves: 'clove',
    olives: 'olive', chives: 'chive', mice: 'mouse', geese: 'goose', teeth: 'tooth',
};

/** One word to its singular, by rule. "eggs" -> "egg", "berries" -> "berry". */
export function singular(word) {
    const w = String(word);
    if (IRREGULAR[w]) { return IRREGULAR[w]; }
    if (NOT_PLURAL.has(w) || w.length < 4) { return w; }
    if (/ies$/.test(w)) { return w.slice(0, -3) + 'y'; }
    if (/(ch|sh|x|ss|zz)es$/.test(w)) { return w.slice(0, -2); }
    if (/oes$/.test(w)) { return w.slice(0, -2); }
    if (/(ss|us|is)$/.test(w)) { return w; }
    if (/s$/.test(w)) { return w.slice(0, -1); }
    return w;
}

/**
   The form to compare and merge on: bareItem (or a stored shopItem/ingkey)
   folded to lower case, no accents, hyphens as spaces, last word singular.
   "Eggs" and "egg" match; "Brûlée" and "brulee" match.
**/
export function bareItemKey(input) {
    const item = typeof input === 'string' ? input : bareItem(input);
    const words = item.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
        .replace(/[-_]/g, ' ').replace(/[^\p{L}\p{N}\s&']/gu, ' ')
        .split(/\s+/).filter(Boolean);
    if (!words.length) { return ''; }
    words[words.length - 1] = singular(words[words.length - 1]);
    return words.join(' ');
}

/**
   The shopping item for a stored ingredient: what the user or client stored
   wins (`shopItem`, then the desktop app's `ingkey`), else the bare item.
**/
export function shopItemFor(ingredient) {
    if (!ingredient || typeof ingredient !== 'object') { return bareItem(ingredient); }
    return ingredient.shopItem || ingredient.ingkey || bareItem(ingredient.text);
}
