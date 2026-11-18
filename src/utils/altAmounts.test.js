// Multiple measures per ingredient (R5-2). Examples are invented; the shapes
// mirror what the real data holds (see docs/modernization/multiple-measures.md).
import { parseMeasure, findMeasureParens, slashToParen, primaryAllowsAlt } from './altAmounts.js';
import { parseIngredientText, normalizeIngredient, normalizeIngredients,
         reparseAltAmounts } from './ingredientParsing.js';

describe('parseMeasure', () => {
    test('a number and one unit we know', () => {
        expect(parseMeasure('225 g')).toEqual({ amount: 225, textAmount: '225', unit: 'g', standardUnit: 'g' });
        expect(parseMeasure('2 cups')).toEqual({ amount: 2, textAmount: '2', unit: 'cups', standardUnit: 'c' });
        expect(parseMeasure('15 ml')).toMatchObject({ amount: 15, unit: 'ml', standardUnit: 'ml' });
    });
    test('fractions, mixed numbers, ranges, a trailing period', () => {
        expect(parseMeasure('1/2 cup')).toMatchObject({ amount: 0.5, unit: 'cup' });
        expect(parseMeasure('3 3/4 cups')).toMatchObject({ amount: 3.75, unit: 'cups', standardUnit: 'c' });
        expect(parseMeasure('1-2 Tbsp.')).toMatchObject({ rangeAmount: 1, amount: 2, unit: 'Tbsp', standardUnit: 'Tbs' });
    });
    test('upper-case metric units (mL, L) are found', () => {
        expect(parseMeasure('250 mL')).toMatchObject({ amount: 250, unit: 'mL', standardUnit: 'ml' });
        expect(parseMeasure('1 L')).toMatchObject({ amount: 1, unit: 'L', standardUnit: 'l' });
    });
    test('sticks are a measure, with no standard unit', () => {
        const m = parseMeasure('2 1/2 sticks');
        expect(m).toMatchObject({ amount: 2.5, unit: 'sticks' });
        expect(m.standardUnit).toBeUndefined();
    });
    test('anything else is not a measure', () => {
        for (const s of ['optional', 'about 3 lemons', 'about 2 cups', '14 oz can', '2 cups sifted',
                         '1 large', '3 medium', '1 clove', '2 inches', '350 F', 'divided', '5', '',
                         '0 g', 'g', '4 x 4 inch', '2 packages']) {
            expect([s, parseMeasure(s)]).toEqual([s, null]);
        }
    });
});

describe('findMeasureParens', () => {
    test('removes the parenthetical and tidies the text', () => {
        expect(findMeasureParens('unsalted butter (2 1/2 sticks)')).toMatchObject({ text: 'unsalted butter' });
        expect(findMeasureParens('butter (1 stick), softened').text).toBe('butter, softened');
        expect(findMeasureParens('(113 g) butter, softened').text).toBe('butter, softened');
        expect(findMeasureParens('dark (60 g) chocolate chips').text).toBe('dark chocolate chips');
        expect(findMeasureParens('flour (240 g) (sifted)').text).toBe('flour (sifted)');
    });
    test('several measures keep their order', () => {
        const found = findMeasureParens('butter (2 sticks) (225 g)');
        expect(found.altAmounts.map((a) => a.unit)).toEqual(['sticks', 'g']);
    });
    test('non-measure parentheticals are left alone', () => {
        for (const s of ['flour (optional)', 'lemons (about 3 lemons)', 'tomatoes (14 oz can)',
                         'potatoes (1 large)', 'sugar (see note)', 'milk (2%)', 'rice (1 inch)',
                         '(14 oz) can tomatoes', '(8 oz) package cream cheese', 'basil (1 bunch)']) {
            expect([s, findMeasureParens(s)]).toEqual([s, null]);
        }
    });
    test('only the measure paren goes when others are present', () => {
        expect(findMeasureParens('flour (optional) (240 g)').text).toBe('flour (optional)');
    });
});

describe('slashToParen', () => {
    test('a slash after a complete measure becomes a paren', () => {
        expect(slashToParen('2 cups / 240 g flour')).toBe('2 cups (240 g) flour');
        expect(slashToParen('2 cups/240 g flour')).toBe('2 cups (240 g) flour');
        expect(slashToParen('1/2 cup / 120 ml milk')).toBe('1/2 cup (120 ml) milk');
    });
    test('fractions and other slashes are left alone', () => {
        for (const s of ['1/2 cup flour', '1 1/2 cups flour', 'salt and/or pepper', '1 cup / 2 eggs',
                         'oil / butter', '2 cups / about 240 g flour']) {
            expect([s, slashToParen(s)]).toEqual([s, s]);
        }
    });
});

describe('primaryAllowsAlt', () => {
    test('measures, counts and sticks yes; containers, sizes and unknown units no', () => {
        expect(primaryAllowsAlt(undefined)).toBe(true);
        expect(primaryAllowsAlt({ amount: 1 })).toBe(true);
        expect(primaryAllowsAlt({ amount: 1, unit: 'cup', standardUnit: 'c' })).toBe(true);
        expect(primaryAllowsAlt({ amount: 285, unit: 'g' })).toBe(true);
        expect(primaryAllowsAlt({ amount: 1, unit: 'stick' })).toBe(true);
        expect(primaryAllowsAlt({ amount: 1, unit: 'can' })).toBe(false);
        expect(primaryAllowsAlt({ amount: 1, unit: 'package' })).toBe(false);
        expect(primaryAllowsAlt({ amount: 1, unit: 'large' })).toBe(false);
        expect(primaryAllowsAlt({ amount: 1, unit: 'jar' })).toBe(false);
    });
});

describe('parseIngredientText with extra measures', () => {
    test('"240 g (2 cups) flour": primary first, the paren is the alternate', () => {
        expect(parseIngredientText('240 g (2 cups) flour')).toEqual({
            text: 'flour',
            originalText: '240 g (2 cups) flour',
            amount: { amount: 240, textAmount: '240', unit: 'g', standardUnit: 'g' },
            altAmounts: [{ amount: 2, textAmount: '2', unit: 'cups', standardUnit: 'c' }],
        });
    });
    test('"flour (2 cups)": the only measure is the primary one', () => {
        expect(parseIngredientText('flour (2 cups)')).toEqual({
            text: 'flour',
            originalText: 'flour (2 cups)',
            amount: { amount: 2, textAmount: '2', unit: 'cups', standardUnit: 'c' },
        });
    });
    test('"2 cups / 240 g flour"', () => {
        const p = parseIngredientText('2 cups / 240 g flour');
        expect(p.text).toBe('flour');
        expect(p.amount).toMatchObject({ amount: 2, unit: 'cups' });
        expect(p.altAmounts).toEqual([{ amount: 240, textAmount: '240', unit: 'g', standardUnit: 'g' }]);
    });
    test('a qualifier after the name survives', () => {
        const p = parseIngredientText('1 cup (113 g) butter, softened');
        expect(p.text).toBe('butter, softened');
        expect(p.altAmounts).toHaveLength(1);
    });
    test('count primary: "1 onion (150 g)"', () => {
        const p = parseIngredientText('1 onion (150 g)');
        expect(p.text).toBe('onion');
        expect(p.amount).toEqual({ amount: 1, textAmount: '1' });
        expect(p.altAmounts[0]).toMatchObject({ amount: 150, unit: 'g' });
    });
    test('a container primary keeps its size in the text, as before', () => {
        for (const line of ['1 can (14 oz) tomatoes', '1 (14 oz) can tomatoes', '2 packages (8 oz each) cream cheese']) {
            expect(parseIngredientText(line).altAmounts).toBeUndefined();
        }
    });
    test('non-measure parentheticals give exactly the old result', () => {
        expect(parseIngredientText('2 cups flour (optional)')).toEqual({
            text: 'flour (optional)',
            originalText: '2 cups flour (optional)',
            amount: { amount: 2, textAmount: '2', unit: 'cups', standardUnit: 'c' },
        });
        expect(parseIngredientText('3 lemons (about 3 lemons)').altAmounts).toBeUndefined();
        expect(parseIngredientText('1 tsp salt (see note)').altAmounts).toBeUndefined();
    });
    test('lines with no parenthesis are untouched', () => {
        expect(parseIngredientText('1 1/2 cups flour, sifted')).toEqual({
            text: 'flour, sifted',
            originalText: '1 1/2 cups flour, sifted',
            amount: { amount: 1.5, textAmount: '1 1/2', unit: 'cups', standardUnit: 'c' },
        });
        expect(parseIngredientText('1/2 cup flour').altAmounts).toBeUndefined();
    });
});

describe('normalizeIngredient with extra measures', () => {
    test('structured amount with the second measure in the text (what an API client wrote)', () => {
        expect(normalizeIngredient({ amount: 285, unit: 'g', ingredient: 'unsalted butter (2 1/2 sticks)' })).toEqual({
            text: 'unsalted butter',
            originalText: 'unsalted butter (2 1/2 sticks)',
            amount: { amount: 285, unit: 'g', standardUnit: 'g' },
            altAmounts: [{ amount: 2.5, textAmount: '2 1/2', unit: 'sticks' }],
        });
        const flour = normalizeIngredient({ amount: 420, unit: 'g', text: 'all-purpose flour (3 3/4 cups)' });
        expect(flour.text).toBe('all-purpose flour');
        expect(flour.altAmounts[0]).toMatchObject({ amount: 3.75, unit: 'cups', standardUnit: 'c' });
        const vanilla = normalizeIngredient({ amount: 5, unit: 'g', text: 'vanilla extract (15 ml)' });
        expect(vanilla.altAmounts[0]).toMatchObject({ amount: 15, unit: 'ml' });
    });
    test('structured amount, non-measure paren: unchanged', () => {
        expect(normalizeIngredient({ amount: 2, unit: 'cups', text: 'flour (optional)' })).toEqual({
            text: 'flour (optional)',
            amount: { amount: 2, unit: 'cups', standardUnit: 'c' },
        });
        expect(normalizeIngredient({ amount: 1, unit: 'can', text: 'tomatoes (14 oz)' }).altAmounts).toBeUndefined();
    });
    test('explicit altAmounts are kept, normalized, and stop the text being searched', () => {
        const ing = normalizeIngredient({
            amount: 2, unit: 'sticks', text: 'butter (1 cup)',
            altAmounts: [{ amount: '225', unit: 'g' }, '1 cup'],
        });
        expect(ing.text).toBe('butter (1 cup)');
        expect(ing.altAmounts).toEqual([
            { amount: 225, textAmount: '225', unit: 'g', standardUnit: 'g' },
            { amount: 1, textAmount: '1', unit: 'cup', standardUnit: 'c' },
        ]);
    });
    test('explicit empty altAmounts opts out and is not stored', () => {
        const ing = normalizeIngredient({ amount: 285, unit: 'g', text: 'butter (2 sticks)', altAmounts: [] });
        expect(ing.text).toBe('butter (2 sticks)');
        expect('altAmounts' in ing).toBe(false);
    });
    test('explicit altAmounts on a text-only entry', () => {
        const ing = normalizeIngredient({ text: 'butter', altAmounts: [{ amount: 225, unit: 'g' }] });
        expect(ing).toEqual({ text: 'butter', originalText: 'butter', altAmounts: [{ amount: 225, unit: 'g', standardUnit: 'g' }] });
    });
    test('junk altAmounts entries are dropped', () => {
        const ing = normalizeIngredient({ amount: 1, unit: 'cup', text: 'milk', altAmounts: [null, {}, 'lots', { amount: 240, unit: 'ml' }] });
        expect(ing.altAmounts).toEqual([{ amount: 240, unit: 'ml', standardUnit: 'ml' }]);
    });
    test('a list, with a group, normalizes each line', () => {
        const list = normalizeIngredients([
            '2 cups (240 g) flour',
            { text: 'FOR THE TOP:', ingredients: ['1 cup / 200 g sugar'] },
        ]);
        expect(list[0].altAmounts).toHaveLength(1);
        expect(list[1].ingredients[0].altAmounts[0]).toMatchObject({ amount: 200, unit: 'g' });
    });
});

describe('reparseAltAmounts (maintenance pass for stored ingredients)', () => {
    test('moves a clean second measure out of the text, keeping the original', () => {
        const stored = { text: 'all-purpose flour (3 3/4 cups)', amount: { amount: 420, unit: 'g', standardUnit: 'g' } };
        const fixed = reparseAltAmounts(stored);
        expect(fixed.text).toBe('all-purpose flour');
        expect(fixed.originalText).toBe('all-purpose flour (3 3/4 cups)');
        expect(fixed.altAmounts[0]).toMatchObject({ amount: 3.75, unit: 'cups' });
        expect(stored.text).toBe('all-purpose flour (3 3/4 cups)'); // input not mutated
    });
    test('leaves everything else alone', () => {
        const amount = { amount: 1, unit: 'cup' };
        expect(reparseAltAmounts({ text: 'flour (optional)', amount })).toBeNull();
        expect(reparseAltAmounts({ text: 'flour', amount })).toBeNull();
        expect(reparseAltAmounts({ text: 'flour (240 g)' })).toBeNull(); // no primary: reparseIngredient's job
        expect(reparseAltAmounts({ text: 'flour (240 g)', amount, altAmounts: [] })).toBeNull();
        expect(reparseAltAmounts({ text: 'tomatoes (14 oz)', amount: { amount: 1, unit: 'can' } })).toBeNull();
        expect(reparseAltAmounts({ text: 'G', ingredients: [] })).toBeNull();
    });
});
