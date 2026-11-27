// Clearing the list: what goes, and what the list must remember anyway.
import { describe, expect, it, vi, beforeEach } from "vitest";

// The save path is the kept glue layer; here we only care what the edit does
// to the stored list document, so the cache is a single row in memory.
let row;
vi.mock("./../data/local/dexieApi.js", () => ({
  default: {
    db: { recipes: { filter: () => ({ toArray: async () => (row ? [row] : []) }) } },
    connect: async () => {},
    updateRecipe: async (rec) => { row = rec; return rec.id ?? 1; },
  },
}));
vi.mock("./../data/recipeData.js", () => ({ default: { updateRecipe: async () => {}, addRecipe: async () => {} } }));

const { shopping, clearList, loadShopping, useLocalOnly } = await import("./shopping.svelte.js");
useLocalOnly();

const list = () => ({
  id: 1, isShoppingList: 1,
  ingredients: [
    { id: 1, text: "Soup", reference: "soup", amount: { amount: 2, unit: "recipe" } },
    { id: 2, text: "Stew", reference: "stew", amount: { amount: 1, unit: "recipe" } },
    { id: 3, text: "onions", shopItem: "onions", amount: { amount: 2, unit: "lb" } },
    { id: 4, text: "ice cream", shopItem: "ice cream" },
  ],
  cart: ["onions"], trip: ["salt"], excludedItems: ["parsley"],
  alreadyHave: ["salt"], alreadyHaveOff: ["flour"], aisles: { onions: "Produce" },
  aisleOrder: ["Produce"], keyAliases: { scallions: "onions" },
});

beforeEach(async () => { row = list(); await loadShopping(); });

const kinds = () => shopping.rec.ingredients.map((i) => (i.reference ? `recipe:${i.text}` : `item:${i.text}`));

describe("clearing the shopping list", () => {
  it("takes off only the recipes when only recipes are chosen", async () => {
    await clearList({ recipes: true, items: false });
    expect(kinds()).toEqual(["item:onions", "item:ice cream"]);
    // Items still on the list keep this trip's marks.
    expect(shopping.rec.cart).toEqual(["onions"]);
    expect(shopping.rec.excludedItems).toEqual(["parsley"]);
  });

  it("takes off only the hand-added items when only items are chosen", async () => {
    await clearList({ recipes: false, items: true });
    expect(kinds()).toEqual(["recipe:Soup", "recipe:Stew"]);
  });

  it("empties the list when both are chosen, and forgets this trip's marks with it", async () => {
    await clearList({ recipes: true, items: true });
    expect(shopping.rec.ingredients).toEqual([]);
    expect(shopping.rec.cart).toEqual([]);
    expect(shopping.rec.trip).toEqual([]);
    expect(shopping.rec.excludedItems).toEqual([]);
  });

  it("keeps what is remembered for every list: pantry, aisles and renames", async () => {
    await clearList({ recipes: true, items: true });
    expect(shopping.rec.alreadyHave).toEqual(["salt"]);
    expect(shopping.rec.alreadyHaveOff).toEqual(["flour"]);
    expect(shopping.rec.aisles).toEqual({ onions: "Produce" });
    expect(shopping.rec.aisleOrder).toEqual(["Produce"]);
    expect(shopping.rec.keyAliases).toEqual({ scallions: "onions" });
  });

  it("changes nothing when neither group is chosen", async () => {
    const before = JSON.parse(JSON.stringify(shopping.rec));
    await clearList({ recipes: false, items: false });
    expect(shopping.rec.ingredients).toEqual(before.ingredients);
  });
});
