import {UNIT_NAMES} from './unitAmounts.js';
let words = [...UNIT_NAMES]
let adjs = ['thin','thick','medium','fine','light','heavy','large','flavorful','fresh','small'];
let verbs = ['slice','dice','mince','chop','peel','discard','retain','keep','hold','boil','bake','saute','sauté','fry','sprinkle','shake','shook','throw','thrown','toss','mix','process','cut'];
// we'll be grammatical profligates...
for (let v of verbs) {
    words.push(v);
    if ('pts'.indexOf(v.substr(v.length-1))>-1) {
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
