import {extractItems,
        getItemMatchers,
       highlightItemText} from './ingredientUtils.js';

it(
    'extract items to remove basic stopwords',
    ()=>{
        expect(extractItems('the garlic')).toEqual(['garlic']);
    }
);
it(
    'extract items to remove some basic cooking words',
    ()=>{
        expect(extractItems('the minced garlic')).toEqual(['garlic']);
        expect(extractItems('the MINCED GARLIC')).toEqual(['GARLIC']);
        expect(extractItems('the chopped garlic')).toEqual(['garlic']);
        expect(extractItems('the chopped garlic mustard')).toEqual(['garlic','mustard']);        
        expect(extractItems('peppers, chopped finely and stems discarded')).toEqual(['peppers','stems']);
    }
);

it(
    'get matchers rocks hard',
    ()=>{
        console.log('Get matchers: "head of true Italian romaine lettuce, finely chopped"')
        let matchers = getItemMatchers("head of true Italian romaine lettuce, finely chopped");
        expect(matchers[0].length).toEqual(4);
        expect(matchers[0].matcher+'').toEqual(/true\W+Italian\W+romain\W+lettuce/gi+'')
    }
);

fit(
    'highlight item text',
    ()=>{
        expect(
            highlightItemText(
                'habaneros (or peppers of choice)',
            )).toEqual(
                '<b>habaneros</b> (or <b>peppers</b> of <b>choice</b>)'
            );
        expect(
            highlightItemText(
                "head of true Italian romaine lettuce, finely chopped"
            )).toEqual(
                "head of <b>true Italian romaine lettuce</b>, finely chopped"
            )
        let longTextWords = []
        for (let i=0; i<1000; i++) {
            longTextWords.push(Math.floor(Math.random()*Math.pow(32,5)).toString(32))
        }
        let text = longTextWords.join(' ');
        let start = new Date().getTime();
        highlightItemText(text);
        let end = new Date().getTime();
        expect(end-start).toBeLessThan(200)

        
        
    }
);
