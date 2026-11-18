import { formatMeasure, formatMeasures } from './formatMeasure.js';

test('household measures use natural fractions and scale', () => {
    expect(formatMeasure({ amount: 2, unit: 'sticks' }, 1)).toBe('2');
    expect(formatMeasure({ amount: 1.5, unit: 'cups', standardUnit: 'c' }, 1)).toBe('1\xa0½');
    expect(formatMeasure({ amount: 1.5, unit: 'cups', standardUnit: 'c' }, 4 / 3)).toBe('2');
    expect(formatMeasure({ amount: 2, unit: 'sticks' }, 4 / 3)).toBe('2\xa0⅔');
    expect(formatMeasure({ rangeAmount: 2, amount: 3, unit: 'tbsp' }, 2)).toBe('4–6');
});

test('grams and ml are shown as stored at x1', () => {
    expect(formatMeasure({ amount: 225, unit: 'g', standardUnit: 'g' }, 1)).toBe('225');
    expect(formatMeasure({ amount: 227.5, unit: 'g', standardUnit: 'g' }, 1)).toBe('227.5');
    expect(formatMeasure({ amount: 113, unit: 'g' }, 1)).toBe('113');
});

test('scaled grams and ml are rounded to what a scale shows', () => {
    const g = (n, m) => formatMeasure({ amount: n, unit: 'g', standardUnit: 'g' }, m);
    expect(g(113, 4 / 3)).toBe('150');      // 150.67
    expect(g(225, 4 / 3)).toBe('300');
    expect(g(285, 4 / 3)).toBe('380');      // 380
    expect(g(285, 1.5)).toBe('430');        // 427.5 -> nearest 5 = 430
    expect(g(30, 4 / 3)).toBe('40');
    expect(g(7, 4 / 3)).toBe('9.3');
    expect(g(900, 2)).toBe('1800');
    expect(formatMeasure({ amount: 15, unit: 'ml', standardUnit: 'ml' }, 2.5)).toBe('38');
    expect(formatMeasure({ amount: 240, unit: 'mL' }, 4 / 3)).toBe('320');
    expect(formatMeasure({ rangeAmount: 100, amount: 120, unit: 'g' }, 1.5)).toBe('150–180');
});

test('kg and litres keep two decimals at most', () => {
    expect(formatMeasure({ amount: 1.5, unit: 'kg', standardUnit: 'kg' }, 4 / 3)).toBe('2');
    expect(formatMeasure({ amount: 1, unit: 'l', standardUnit: 'l' }, 1.25)).toBe('1.25');
});

test('nothing to show without a number', () => {
    expect(formatMeasure(undefined, 1)).toBe('');
    expect(formatMeasure({ unit: 'g' }, 1)).toBe('');
});

test('formatMeasures lists the primary first, then the alternates', () => {
    expect(formatMeasures(
        { amount: 2, unit: 'sticks' },
        [{ amount: 225, unit: 'g', standardUnit: 'g' }],
        1,
    )).toEqual(['2\xa0sticks', '225\xa0g']);
    expect(formatMeasures({ amount: 2, unit: 'sticks' }, [{ amount: 225, unit: 'g', standardUnit: 'g' }], 4 / 3))
        .toEqual(['2\xa0⅔\xa0sticks', '300\xa0g']);
    expect(formatMeasures(undefined, undefined, 1)).toEqual([]);
    expect(formatMeasures({ amount: 2 }, undefined, 1)).toEqual(['2']);
    expect(formatMeasures(undefined, [{ amount: 225, unit: 'g' }], 1)).toEqual(['225\xa0g']);
});
