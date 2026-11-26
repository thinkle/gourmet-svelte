import {cleanupWhitespace} from './textUtils.js'
import {reEscape} from './regExpUtil.js';

const UNIT_CONVERSIONS = [
    // American volume
    {bigger:"tsp",
     smaller:"drop",
     multiplier:76},
    {bigger:"Tbs",
     smaller:"tsp",
     multiplier:3},
    {bigger:"fl oz",
     smaller:"Tbs",
     multiplier:2},
    {bigger:"c",
     smaller:"fl oz",
     multiplier:8},
    {bigger:"pt",
     smaller:"c",
     multiplier:2},
    {bigger:"qt",
     smaller:"c",
     multiplier:4},
    {bigger:"gallon",
     smaller:"qt",
     multiplier:4},
    // Dry units...
    {bigger:"bucket",
     smaller:"peck",
     multiplier:2},
    {bigger:"bushel",
     smaller:"bucket",
     multiplier:2},


    // American weights
    {bigger:"lb",
     smaller:"oz",
     multiplier:16},
    {bigger:"oz",
     smaller:"dram",
     multiplier:16},
    {bigger:"lb",
     smaller:"grains",
     multiplier:7000},


    // {bigger:"l",
    //  smaller:"qt",
    //  multiplier:1.057},
    {bigger:'Japanese cup',
     smaller:'ml',
     multiplier:200},
    // Other cups...
    {bigger:'metric cup',
     smaller:'ml',
     multiplier:250},
    {bigger:'Imperial cup',
     smaller:'ml',
     multiplier:284.130625},
    {bigger:'Imperial pint',
     smaller:'oz',
     multiplier:20},

    // Metric volumes
    {bigger:"l",
     smaller:"ml",
     multiplier:1000},
    {bigger:"l",
     smaller:"cl",
     multiplier:100},
    {bigger:"l",
     smaller:"dl",
     multiplier:10},

    // Metric weights
    {bigger:"kg",
     smaller:"g",
     multiplier:1000},
    {bigger:"g",
     smaller:"mg",
     multiplier:1000},


    // Metric to American/Imperial...
    {bigger:"oz",
     smaller:"g",
     multiplier:28.35},
    {bigger:"fl oz",
     smaller:"ml",
     multiplier:29.5735},
    // Don't define peck in terms of gallons --
    // it's in terms of dry gallons, which maybe aren't even a real
    // US standard?
    {bigger:"peck",
     smaller:"l",
     multiplier:8.809},

    // {
    //     bigger: "c", // US Cup
    //     smaller : "ml",
    //     multiplier:240,
    // },
]
/**
* DENSITIES of common foods. This allows us to convert between mass and volume.
* Translators: You may be best off translating the food names below, since lists
* of food densities can be hard to come by!
**/
const DENSITY_TABLE = {
    "water":1,
    "juice, grape":1.03,
    "vegetable broth":1,
    "broth, vegetable":1,
    "broth, chicken":1,
    "milk":1.029,
    "milk, whole":1.029,
    "milk, skim":1.033,
    "milk, 2%":1.031,
    "milk, 1%":1.03,
    "coconut milk":0.875,
    "buttermilk":1.03,
    "heavy cream":0.994,
    "light cream":1.012,
    "half and half":1.025,
    "honey":1.420,
    "sugar, granulated":0.9,
    "salt":2.165,
    "butter":0.911,
    "oil, vegetable":0.88,
    "oil, olive":0.88,
    "oil, corn":0.88,
    "oil, sesame":0.88,
    "flour, all purpose": 0.55,
    "flour, whole wheat": 0.53,
    "corn starch": 0.6,
    "sugar, powdered": 0.6,
    "sugar, confectioners": 0.6
}
/**
# Standard unit names and alternate unit names that might appear.  For
# example: "c." is our standard abbreviation for cup.  "cup","c." or
# "cups" might appear in a recipe we are importing.  Each item of this
# list looks like this:
#
# ["standard", ["alternate1","alternate2","alternate3",...]]
#
# The first item should be the preferred abbreviation
# The second item should be the full name of the unit
# e.g. ["c.", ["cup",...]]
#
**/
const UNIT_SYNONYMS = {
    "each":["eaches",  "ea",   "ea."],
    "fl oz": ["fl oz",      "fluid ounce","fluid ounces","fl ounces",   "fl. ounces","fl. oz",     "fl oz.",     "fl. oz."],
    "tsp":   ["teaspoon",   "teaspoons",  "tea_spoon",   "tea_spoons",  "Teaspoon",  "Teaspoons",  "Tea_spoon",  "Tea_spoons",  "tsps","tsps.","Tsps","Tsps.","tsp","tsp.","Tsp","Tsp.","ts","ts.","Ts","Ts.","t","t."],
    "Tbs":   ["tablespoon", "tablespoons","table_spoon", "table_spoons","Tablespoon","Tablespoons","Table_spoon","Table_spoons","tbsp","tbsp.","Tbsp","Tbsp.","tbs","tbs.","Tbs","Tbs.","tb","tb.","Tb","Tb.","T","T."],
    "lb":    ["pound",      "pounds",     "lbs",  "lbs.",  "lb",  "lb."],
    "oz":    ["ounce",      "ounces",     "oz",   "oz."],
    "c":     ["cup",        "cups",       "c."],
    "qt":    ["quart",      "quarts",     "qt.",  "Qt", "Qt."],
    "pt":    ["pint",       "pints",      "pt.",  "Pt", "Pt."],
    "gallon":["gallon",     "gallons",    "gal",  "gal."],
    "ml":    ["milliliter",  "milliliters", "ml",   "ml."],
    "cl":    ["centiliter", "centiliters","cl",   "cl."],
    "dl":    ["deciliter",  "deciliters", "dl",   "dl."],
    "l":     ["liter",      "liters",     "lit.", "l", "l."],
    "g":     ["grams",    "gram",      "g.", "g", "gr", "gr."],
    "mg":    ["milligram", "milligrams", "mg", "mg."],
    "kg":    ["kilogram", "kilograms", "kg", "kg."],
    /*# These names aren"t really convertible, but we want them to
      # be recognized as units.*/
    "small": ["small",  "Small",    "sm",  "sm."],
    "medium":["medium", "Medium",   "med", "med.", "Med", "Med."],
    "large": ["large",  "Large",    "lg",  "lg.",  "Lg",  "Lg."],
    "box":   ["box",    "Box",      "bx"],
    "whole": ["whole",  "whl",      "wh."],
    "clove": ["clove",  "cloves",   "clv",    "clv."],
    "can":   ["can",    "Can",      "cn",      "cn."],
    "head":  ["head",   "heads",    "Head",    "Heads",    "hd",       "hd."],
    "package":["pkg.",   "package",  "Package", "packages", "Packages", "pkg", "Pkg.", "pack"],
    "slice": ["slice",  "slices"],
    "bunch": ["bunch",  "bunches"],
    "stick": ["stick",  "sticks"],   // butter, cinnamon
    "square":["square", "squares"],  // chocolate
}

// Python defaults/defaults_en.py:687–719. JavaScript needs arrays, not
// Python tuples: (a, b) is a comma expression whose value is only b.
export const METRIC_RANGE = [1, 999];
export const UNIT_GROUPS = {
    'metric mass': [['mg', METRIC_RANGE], ['g', METRIC_RANGE], ['kg', [1, undefined]]],
    'metric volume': [['ml', METRIC_RANGE], ['cl', [1, 99]], ['dl', [1, 9]], ['l', [1, undefined]]],
    'imperial weight': [['grains', [0, 27]], ['dram', [0.5, 15]], ['oz', [0.25, 32]], ['lb', [0.25, undefined]]],
    'imperial volume': [['tsp', [0.125, 5.9]], ['Tbs', [1, 4]], ['c', [0.25, 8]], ['gallon', [1, undefined]], ['fl oz', [1, undefined]]],
};

const unitGroups = new Map();
const readableRanges = new Map();
for (const [group, units] of Object.entries(UNIT_GROUPS)) {
    for (const [unit, range] of units) {
        unitGroups.set(unit, group);
        readableRanges.set(unit, range);
    }
}
// Python omitted these from its lookup as well as its candidates, so incoming
// pints/quarts could never be adjusted. Recognize them without introducing them.
unitGroups.set('pt', 'imperial volume');
unitGroups.set('qt', 'imperial volume');

export const UNIT_NAMES = []
export const UNIT_LOOKUP = {}
for (var key in UNIT_SYNONYMS) {
    UNIT_LOOKUP[key] = key;
    UNIT_NAMES.push(key);
    UNIT_SYNONYMS[key].forEach((w)=>{
        UNIT_LOOKUP[w] = key
        UNIT_NAMES.push(w)
    });
}

//export const UNIT_REGEXP_STRING = '\\b(?<unit>'+UNIT_NAMES.join('|')+')\\b'
UNIT_NAMES.sort()
export const UNIT_REGEXP_STRING = '\\b('+UNIT_NAMES.map(reEscape).join('|')+'[.]?)(\\b|$)' // FF doesn't support named regexps :(
export const UNIT_REGEXP = new RegExp(
    UNIT_REGEXP_STRING,'i'
);

export const toMilliliters = {}
export const toGrams = {}

// create unit chart...
createUnitMapping('ml',toMilliliters)
createUnitMapping('g',toGrams);

function createUnitMapping (baseUnit, mapping) {
    mapping[baseUnit] = 1;
    let newItems = []
    let toMap = [baseUnit]
    let mapped = []
    while (toMap.length > 0) {
        let mapNext = []
        for (let unit of toMap) {
            let unitsToMap = doMap(unit,baseUnit,mapping);
            mapped.push(unit);
            for (let u of unitsToMap) {
                if (mapped.indexOf(u)==-1) {
                    mapNext.push(u);
                }
            }
        }
        toMap = mapNext;
    }
    function doMap (unit, target, mapping) {
        toMap = [];
        for (let uc of UNIT_CONVERSIONS) {
            if (uc.bigger==unit && !mapping[uc.smaller]) {
                mapping[uc.smaller] = (1/uc.multiplier) * mapping[unit]
                toMap.push(uc.smaller);
            }
            else if (uc.smaller==unit && !mapping[uc.bigger]) {
                mapping[uc.bigger] = uc.multiplier * mapping[unit]
                toMap.push(uc.bigger);
            }
        }
        return toMap
    }
}


export function getStandardUnit (unit) {
    if (!unit) {return}
    return Object.hasOwn(UNIT_LOOKUP, unit) ? UNIT_LOOKUP[unit] : undefined
}

export function getMultiplierConversion (unit1, unit2, density) {
    // Multiply unit1 by X to get amount in unit2
    return 1/getInAConversion(unit1,unit2,density)
}

export function getInAConversion (unit1, unit2, density) {
    // There are ____ unit1 IN A unit2
    // Note: capitalization *can* matter for units (i.e. "t" vs. "T"
    // for tsp and Tablespoon) but usually doesn't...
    unit1 = getStandardUnit(unit1);
    unit2 = getStandardUnit(unit2);
    if (toMilliliters[unit1]) {
        // both volume! (e.g. unit1 = tsp, unit2 = Tbs
        let unit1inML = toMilliliters[unit1]; // eg 5 ml in tsp.
        let unit2inML
        if (toMilliliters[unit2]) {
            unit2inML = toMilliliters[unit2]; // eg 15 tsp.
        }
        else {
            //
            // d = m / v
            // v = (m / density)
            if (density && toGrams[unit2]) {
                // cool, we got grams...
                unit2inML = toGrams[unit2] / density
            }
        }
        if (!unit2inML) {return undefined}
        return unit2inML/unit1inML // eg multiply by 3 to get from tsp to Tbs
    }
    if (toGrams[unit1]) {
        // both mass...
        let unit1inG = toGrams[unit1]; // eg 5
        let unit2inG;
        if (toGrams[unit2]) {
            unit2inG = toGrams[unit2]; // eg 15
        }
        else if (toMilliliters[unit2] && density) {
            // d = m / v
            // m = d * v
            unit2inG = toMilliliters[unit2] * density
        }
        return unit2inG/unit1inG // eg multiply by 3 to get from tsp to Tbs
    }
}

export function analyzeUnit (unit) {
    // Some units are automatically convertible, in which case, we should know that...
    // If we have a standardized unit, we will store it.
    if (unit) {
        return {
            unit : unit,
            standardUnit : getStandardUnit(unit)
        }
    }
    return unit
}


export function parseUnit (text, requireIngredient=false) {
    let m = text.match(UNIT_REGEXP);
    if (m) {
        let unit = m[1]
        let pretext = text.substr(0,m.index);
        let posttext = text.substr(m.index+unit.length)
        text = ''
        if (pretext.replace(/^\W+|\W+$/g)) {
            text = pretext + ' '
        }
        if (posttext.replace(/^\W+|\W+$/g)) {
            text += cleanupWhitespace(posttext)
        }
        text = cleanupWhitespace(text);
        if (requireIngredient) {
            if (unit && !text) {
                text = unit;
                unit = undefined;
            }
        }
        let unitDetails = analyzeUnit(unit);
        return {
            ...unitDetails,
            unit,text,pretext,posttext
        }
    }
    else {
        return {text:cleanupWhitespace(text)}
    }
}

// Python convert.py:293–357: simple fractions, then preferred amount ranges.
// This scores without rounding or changing the physical quantity.
export function readabilityScore(amount, unit) {
    if (!Number.isFinite(amount) || amount < 0) return -Infinity;
    const nearInteger = (n) => Math.abs(n - Math.round(n)) <= 0.01 + 1e-10;
    let score = -2;
    for (const [denominator, reward] of [[1, 1], [2, 1], [4, 1], [3, 1], [8, 0.8], [6, 0.3], [5, 0.2], [10, 0.05]]) {
        if (nearInteger(amount * denominator)) {
            score = reward;
            break;
        }
    }
    if (Math.abs(amount - 1) <= 1e-9) score += 0.5;
    const range = readableRanges.get(getStandardUnit(unit) || unit);
    if (range && amount > 0) {
        const [min, max] = range;
        if (min && amount < min - 1e-9) score -= 2 + 2 * (min - amount) / amount;
        if (max && amount > max + 1e-9) score -= 2 + 2 * (amount - max) / max;
    }
    return score;
}

// Display-only selection within the input's measurement system and dimension.
// Shopping disables the optional Python +1 current-unit bonus. Equal scores
// retain the current unit, then prefer the closest candidate in Python's order.
export function adjustAmountUnit(amountObj, { favorCurrentUnit = true } = {}) {
    const unit = getStandardUnit(amountObj?.unit) || amountObj?.unit;
    const amount = amountObj?.amount;
    const rangeAmount = amountObj?.rangeAmount;
    const isRange = Number.isFinite(rangeAmount);
    const group = unitGroups.get(unit);
    if (!group || !Number.isFinite(amount) || amount <= 0 || (isRange && rangeAmount < 0)) {
        return { ...amountObj };
    }
    const units = UNIT_GROUPS[group];
    const index = units.findIndex(([candidate]) => candidate === unit);
    // Score the less readable endpoint, avoiding a unit that obscures one end.
    // Zero is valid in a range but does not constrain its measurement scale.
    const scoreIn = (factor, candidate) => Math.min(
        readabilityScore(amount * factor, candidate),
        isRange && rangeAmount > 0 ? readabilityScore(rangeAmount * factor, candidate) : Infinity,
    );
    let best = { ...amountObj, unit };
    let bestScore = scoreIn(1, unit) + (favorCurrentUnit ? 1 : 0);
    let bestDistance = 0;
    for (const [candidateIndex, [candidate]] of units.entries()) {
        // Owner policy: fl oz is useful when supplied, but is usually worse as
        // a newly introduced unit (Python could turn 10 cups into 80 fl oz).
        if (candidate === 'fl oz' && unit !== 'fl oz') continue;
        const factor = getMultiplierConversion(unit, candidate);
        if (!Number.isFinite(factor) || factor <= 0) continue;
        const score = scoreIn(factor, candidate);
        const distance = Math.abs(index - candidateIndex);
        if (score > bestScore + 1e-9 || (Math.abs(score - bestScore) <= 1e-9 && distance < bestDistance)) {
            best = { ...amountObj, unit: candidate, amount: amount * factor,
                ...(isRange ? { rangeAmount: rangeAmount * factor } : {}) };
            bestScore = score;
            bestDistance = distance;
        }
    }
    return best;
}

// Add compatible quantities without density conversion. Keep the largest input
// unit; callers can select a readable display unit once after all additions.
// A scalar contributes the same amount to both ends when added to a range.
export function addAmounts(amounts, item) {
    const byUnit = new Map();
    for (const amountObj of amounts) {
        let unit = getStandardUnit(amountObj?.unit) || amountObj?.unit || '';
        const amount = amountObj?.amount ?? 1;
        const hasRange = Number.isFinite(amountObj?.rangeAmount);
        const low = hasRange ? amountObj.rangeAmount : amount;
        let added = false;
        for (const [otherUnit, previous] of byUnit) {
            let factor = unit === otherUnit ? 1 : getMultiplierConversion(unit, otherUnit);
            if (!Number.isFinite(factor) || factor <= 0) continue;
            if (factor <= 1) {
                previous.amount += amount * factor;
                previous.low += low * factor;
                previous.hasRange ||= hasRange;
            } else {
                factor = getMultiplierConversion(otherUnit, unit);
                byUnit.delete(otherUnit);
                byUnit.set(unit, {
                    amount: amount + previous.amount * factor,
                    low: low + previous.low * factor,
                    hasRange: hasRange || previous.hasRange,
                });
            }
            added = true;
            break;
        }
        if (!added) byUnit.set(unit, { amount, low, hasRange });
    }
    return [...byUnit].map(([unit, value]) => ({
        unit, amount: value.amount,
        ...(value.hasRange ? { rangeAmount: value.low } : {}),
    }));
}


export default {
    UNIT_REGEXP_STRING,
    UNIT_REGEXP,
    UNIT_LOOKUP,
    UNIT_CONVERSIONS,
    DENSITY_TABLE,
    UNIT_GROUPS,
    METRIC_RANGE,
    parseUnit
}
