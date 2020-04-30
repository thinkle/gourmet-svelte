const UNIT_CONVERSIONS = [
    {bigger:"c",
     smaller:"Tbs",
     multiplier:16},
    {bigger:"lb",
     smaller:"oz",
     multiplier:16},
    {bigger:"Tbs",
     smaller:"tsp",
     multiplier:3},
    {bigger:"pt",
     smaller:"c",
     multiplier:2},
    {bigger:"qt",
     smaller:"c",
     multiplier:4},
    {bigger:"gallon",
     smaller:"qt",
     multiplier:4},
    {bigger:"l",
     smaller:"qt",
     multiplier:1.057},
    {bigger:'Japanese cup',
     smaller:'ml',
     multiplier:200},
    {bigger:'metric cup',
     smaller:'ml',
     multiplier:250},
    {bigger:'Imperial cup',
     smaller:'ml',
     multiplier:284.130625},
    {bigger:'Imperial pint',
     smaller:'oz',
     multiplier:20},
    {bigger:"l",
     smaller:"ml",
     multiplier:1000},
    {bigger:"l",
     smaller:"cl",
     multiplier:100},
    {bigger:"l",
     smaller:"dl",
     multiplier:10},
    {bigger:"oz",
     smaller:"g",
     multiplier:28.35},
    {bigger:"fl oz",
     smaller:"Tbs",
     multiplier:2},
    {bigger:"kg",
     smaller:"g",
     multiplier:1000},
    {bigger:"g",
     smaller:"mg",
     multiplier:1000},
    {bigger:"tsp",
     smaller:"drop",
     multiplier:76},
    {bigger:"oz",
     smaller:"dram",
     multiplier:16},
    {bigger:"dram",
     smaller:"grains",
     multiplier:27.34375},
    {bigger:"peck",
     smaller:"gallon",
     multiplier:2},
    {bigger:"bucket",
     smaller:"peck",
     multiplier:2},
    {bigger:"bushel",
     smaller:"bucket",
     multiplier:2},
    {bigger:"lb",
     smaller:"grains",
     multiplier:7000}
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
    "each":["each",   "eaches",  "ea",   "ea."],
    "fl oz": ["fl oz",      "fluid ounce","fluid ounces","fl ounces",   "fl. ounces","fl. oz",     "fl oz.",     "fl. oz."],
    "tsp":   ["teaspoon",   "teaspoons",  "tea_spoon",   "tea_spoons",  "Teaspoon",  "Teaspoons",  "Tea_spoon",  "Tea_spoons",  "tsps","tsps.","Tsps","Tsps.","tsp","tsp.","Tsp","Tsp.","ts","ts.","Ts","Ts.","t","t."],
    "Tbs":   ["tablespoon", "tablespoons","table_spoon", "table_spoons","Tablespoon","Tablespoons","Table_spoon","Table_spoons","tbsp","tbsp.","Tbsp","Tbsp.","tbs","tbs.","Tbs","Tbs.","tb","tb.","Tb","Tb.","T","T."],
    "lb":    ["pound",      "pounds",     "lbs",  "lbs.",  "lb",  "lb."],
    "oz":    ["ounce",      "ounces",     "oz",   "oz."],
    "c":     ["cup",        "cups",       "c."],
    "qt":    ["quart",      "quarts",     "qt.",  "Qt", "Qt."],
    "pt":    ["pint",       "pints",      "pt.",  "Pt", "Pt."],
    "gallon":["gallon",     "gallons",    "gal",  "gal."],
    "ml":    ["mililiter",  "mililiters", "ml",   "ml."],
    "cl":    ["centiliter", "centiliters","cl",   "cl."],
    "dl":    ["deciliter",  "deciliters", "dl",   "dl."],
    "l":     ["liter",      "liters",     "lit.", "l", "l."],
    "g":     ["grams",    "gram",      "g.", "g", "gr", "gr."],
    "mg":    ["miligram", "miligrams", "mg", "mg."],
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
}

const METRIC_RANGE = (1,999)
/*
# The following sets up unit groups. Users will be able to turn
# these on or off (American users, for example, would likely turn
# off metric units, since we don't use them).
# (User choice not implemented yet)
*/
const UNIT_GROUPS = {
    'metric mass':[('mg',METRIC_RANGE),
                   ('g',METRIC_RANGE),
                   ('kg',(1,undefined))],
    'metric volume':[('ml',METRIC_RANGE),
                     ('cl',(1,99)),
                     ('dl',(1,9)),
                     ('l',(1,undefined)),],
    'imperial weight':[('grains',(0,27)),
                       ('dram',(0.5,15)),
                       ('oz',(0.25,32)),
                       ('lb',(0.25,undefined)),
                       ],
    'imperial volume':[
        //('drop',(0,3)),
        ('tsp',(0.125,5.9)),
        ('Tbs',(1,4)),
        ('c',(0.25,8)),
        //('pt',(1,1)),
        //('qt',(1,3)),
        ('gallon',(1,undefined)),
        //('peck',(1,2)),
        //('bucket',(1,2)),
        //('bushel',(1,undefined)),
        ('fl oz',(1,undefined)),
    ]
}

const UNIT_NAMES = []
for (var key in UNIT_SYNONYMS) {
    UNIT_NAMES.push(key);
    UNIT_SYNONYMS[key].forEach((w)=>UNIT_NAMES.push(w));
}

const urgs = '((\\s+|^)('+UNIT_NAMES.join('|')+'))(?=(\\s+|$))'
const UNIT_REGEXP = new RegExp(
    urgs
);
export default {
    UNIT_REGEXP,
    UNIT_SYNONYMS,
    UNIT_CONVERSIONS,
    DENSITY_TABLE,
    UNIT_GROUPS,
    METRIC_RANGE
}
