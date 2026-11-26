import { describe, expect, it } from 'vitest';
import { buildList } from './shoppingList.js';

const soup = { _id: 'soup', id: 1, title: 'Soup', ingredients: [
  { text: 'onions', shopItem: 'onions', amount: { amount: 2, unit: 'lb' } },
  { text: 'carrots', shopItem: 'carrots', amount: { amount: 1, unit: 'lb' } },
] };
const rec = () => ({ ingredients: [
  { id: 1, text: 'Soup', reference: 'soup', amount: { amount: 2, unit: 'recipe' } },
  { id: 2, text: 'onions', shopItem: 'onions', amount: { amount: 1, unit: 'lb' } },
], cart: ['onions'], aisles: { onions: 'Produce' }, alreadyHave: [], excludedItems: ['onions'] });

describe('list-only MCP item removal', () => {
  it('hides all contributions to an excluded merged item without changing recipes or remembered settings', () => {
    const source = structuredClone(soup);
    const list = rec(); const before = structuredClone(list);
    const result = buildList(list, [source]);
    expect(result.items.map((i) => i.key)).toEqual(['carrots']);
    expect(result.cart).toEqual([]);
    expect(result.keys.has('onions')).toBe(false);
    expect(result.groups.flatMap((g) => g.items).map((i) => i.key)).toEqual(['carrots']);
    expect(source).toEqual(soup); expect(list).toEqual(before);
  });
  it('applies exclusions after aliases, using the canonical key returned to MCP clients', () => {
    const list = { ...rec(), keyAliases: { onions: 'alliums' }, excludedItems: ['alliums'] };
    expect(buildList(list, [soup]).items.map((i) => i.key)).toEqual(['carrots']);
    list.excludedItems = [];
    const restored = buildList(list, [soup]).items.find((i) => i.key === 'alliums');
    expect(restored.baseKeys).toEqual(['onions']);
    expect(restored.from).toHaveLength(2);
    expect(restored.amounts[0]).toMatchObject({ amount: 5, unit: 'lb' });
  });
  it('keeps old lists without exclusions unchanged and does not turn exclusions into pantry items', () => {
    const list = rec(); delete list.excludedItems;
    const result = buildList(list, [soup]);
    expect(result.items.map((i) => i.key)).toEqual(['carrots', 'onions']);
    expect(result.cart.map((i) => i.key)).toEqual(['onions']);
    expect(result.alreadyHave).toEqual([]);
  });
});
