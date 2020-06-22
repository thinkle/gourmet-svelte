import {extractItems,
        getItemMatchers,
        markupTextForIngredient,
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
        expect(extractItems('peppers, chopped finely and stems discarded')).toEqual(['peppers']);
    }
);

it(
    'get matchers rocks hard',
    ()=>{
        console.log('Get matchers: "head of true Italian romaine lettuce, finely chopped"')
        let matchers = getItemMatchers("head of true Italian romaine lettuce, finely chopped");
        expect(matchers[0].length).toEqual(4);
        expect(matchers[0].matcher+'').toMatch(/Italian.*romain.*lettuce/)
    }
);

it(
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


it(
    'No blank replacers',
    ()=>{
        expect(markupTextForIngredient('Eat garlic!',{text:'garlic'})).
            toMatch('>garlic<')
        expect(()=>markupTextForIngredient('Foo',{text:''})).not.toThrow();
        expect(markupTextForIngredient('Foo',{text:''})).toEqual('Foo');
    }
);

it(
    'Case insensitive replacing and plurals and stuff',
    ()=>{
        // Handle plurals
        expect(
            markupTextForIngredient('some delicious potatoes',{text:'potato'})
        ).toMatch(/>potatoes</)
        // Case insensitive
        expect(
            markupTextForIngredient('some delicious POTATOES',{text:'potato'})
        ).toMatch(/>POTATOES</)
        // Filter out prep words
        expect(
            markupTextForIngredient('eat that boiled, minced shrimp',{text:'boiled, minced shrimp'})
        ).toMatch(/>shrimp</)
    }
);

it(
    'No accidental regexps',
    ()=>{
        expect(markupTextForIngredient('Eat garlic!',{text:'\\w\\s+'})).
            toEqual('Eat garlic!');
        expect(markupTextForIngredient('Eat garlic garlicc garlicccccc !',{text:'garlic+'})).toMatch(/>garlic<.*\s+garlicc\s+garliccccc/)
        expect(markupTextForIngredient('Chives',{text:'Ch[i]ves'})).toEqual('Chives');
    }
);
