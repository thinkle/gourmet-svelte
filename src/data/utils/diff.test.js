import {diffRecs} from './diff.js';

it(
    'Simple differences',
    ()=>{
        expect(diffRecs({title:'hi'},{title:'howdy'})).toBeTruthy();
        expect(diffRecs({title:'hi'},{title:'hi'})).toBeFalsy();
    }
);
it(
    'Array properties',
    ()=>{
        expect(diffRecs({images:[]},{})).toBeFalsy();
        expect(diffRecs({},{categories:[]})).toBeFalsy();
        expect(diffRecs({categories:['Dessert']},{categories:[]})).toBeTruthy();
    }
);
