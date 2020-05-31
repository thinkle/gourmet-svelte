import {UNIT_NAMES} from './unitAmounts.js';
let words = [...UNIT_NAMES,
             // words added directly here won't have any attempts to handle
             // suffixes, which may be what we want
             'seeded', // but not seeds/seed
            ]

let adjs = [
    'fine',
    'flavorful',
    'fresh',
    'heavy',
    'large',
    'light',
    'medium',
    'small',
    'thick',
    'thin',
];
let verbs = [
    'bake',
    'blanch',
    'boil',
    'chop',
    'cool',
    'core',
    'cube',
    'cut',
    'defrost',
    'devein',
    'dice',
    'discard',
    'flambe',
    'flambé',
    'fry',
    'grill',
    'grind',
    'halve',
    'heat',
    'hold',
    'keep',
    'melt',
    'mince',
    'mix',
    'peel',
    'poach',
    'process',
    'retain',
    'rub',
    'saute',
    'sauté',
    'scrape',
    'serve',
    'shake',
    'shook',
    'shred',
    'sift',
    'slice',
    'soften',
    'sprinkle',
    'squeeze',
    'squirt',
    'stem',
    'stir',
    'throw',
    'thrown',
    'toss',
    'whisk'
];
// we'll be grammatical profligates...
for (let v of verbs) {
    words.push(v);
    if ('bdmpts'.indexOf(v.substr(v.length-1))>-1) {
        words.push(v+v.substr(v.length-1)+'ed');
        words.push(v+v.substr(v.length-1)+'ing');
    }
    if (v.substr(v.length-1)=='y') {
        words.push(v.substr(0,v.length-1)+'ied')
        words.push(v.substr(0,v.length-1)+'ies')
    }
    words.push(v+'ed')
    words.push(v+'ing')
    words.push(v+'d')
    words.push(v+'s');
}
for (let a of adjs) {
    words.push(a)
    words.push(a+'er')
    words.push(a+'r')
    words.push(a+'st')
    words.push(a+'est')
    words.push(a+'ly')
}

export default words;
