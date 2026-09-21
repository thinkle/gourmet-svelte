import {parseIngredientText, normalizeIngredient, normalizeIngredients} from './ingredientParsing.js';

test(
    'parseIngredientText pulls apart amount, unit and name',
    () => {
        expect(parseIngredientText('1 1/2 cups flour, sifted')).toEqual({
            text: 'flour, sifted',
            originalText: '1 1/2 cups flour, sifted',
            amount: {
                amount: 1.5,
                textAmount: '1 1/2',
                unit: 'cups',
                standardUnit: 'c',
            },
        });
    }
);

test(
    'parseIngredientText treats a lone unit word as the ingredient',
    () => {
        const parsed = parseIngredientText('2 eggs');
        expect(parsed.text).toEqual('eggs');
        expect(parsed.amount.amount).toEqual(2);
        expect(parsed.amount.unit).toBeUndefined();
    }
);

test(
    'parseIngredientText handles ranges and amount-less ingredients',
    () => {
        const range = parseIngredientText('2 to 3 tablespoons olive oil');
        expect(range.text).toEqual('olive oil');
        expect(range.amount.rangeAmount).toEqual(2);
        expect(range.amount.amount).toEqual(3);
        expect(range.amount.standardUnit).toEqual('Tbs');
        expect(parseIngredientText('salt to taste')).toEqual({
            text: 'salt to taste',
            originalText: 'salt to taste',
        });
    }
);

test(
    'normalizeIngredient keeps structured input as-is',
    () => {
        expect(normalizeIngredient({amount: 2, unit: 'cups', ingredient: 'milk'})).toEqual({
            text: 'milk',
            amount: {amount: 2, unit: 'cups', standardUnit: 'c'},
        });
    }
);

test(
    'normalizeIngredient parses a string amount and finds a unit hiding in it',
    () => {
        expect(normalizeIngredient({amount: '1 1/2', unit: 'tsp', ingredient: 'vanilla'}).amount.amount)
            .toEqual(1.5);
        expect(normalizeIngredient({amount: '2 cups', ingredient: 'sugar'}).amount.unit)
            .toEqual('cups');
    }
);

test(
    'normalizeIngredient puts a range back in low-then-high order',
    () => {
        const ing = normalizeIngredient({amount: 2, rangeAmount: 3, unit: 'cloves', ingredient: 'garlic'});
        expect(ing.amount.rangeAmount).toEqual(2);
        expect(ing.amount.amount).toEqual(3);
    }
);

test(
    'normalizeIngredients parses plain strings and nested groups',
    () => {
        const list = normalizeIngredients([
            '3 tbsp. butter',
            {text: 'FOR THE DOUGH:', ingredients: ['2 cups flour', '1 tsp salt']},
        ]);
        expect(list[0].text).toEqual('butter');
        expect(list[0].amount.standardUnit).toEqual('Tbs');
        expect(list[1].text).toEqual('FOR THE DOUGH:');
        expect(list[1].amount).toBeUndefined();
        expect(list[1].ingredients.map((i) => i.text)).toEqual(['flour', 'salt']);
        expect(list[1].ingredients[1].amount).toEqual({
            amount: 1, textAmount: '1', unit: 'tsp', standardUnit: 'tsp',
        });
    }
);

test(
    'normalizeIngredients leaves an already-canonical ingredient alone',
    () => {
        expect(normalizeIngredients([{text: 'butter', amount: {amount: 3, unit: 'tbsp'}}])).toEqual([
            {text: 'butter', amount: {amount: 3, unit: 'tbsp', standardUnit: 'Tbs'}},
        ]);
    }
);

test(
    'normalizeIngredients accepts a newline-separated block of text',
    () => {
        expect(normalizeIngredients('2 cups flour\n1 tsp salt\n').map((i) => i.text))
            .toEqual(['flour', 'salt']);
    }
);
