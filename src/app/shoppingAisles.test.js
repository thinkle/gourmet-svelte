import { describe, it, expect } from "vitest";
import { DEFAULT_AISLES, guessAisle } from "./shoppingAisles.js";
import { baseKey, buildList } from "./shoppingList.js";
import { parseIngredientText } from "../utils/ingredientParsing.js";

describe("store aisle suggestions", () => {
  it.each([
    ["red onions", "Produce"],
    ["fresh green beans", "Produce"],
    ["sourdough bread", "Bakery"],
    ["eggs", "Dairy & eggs"],
    ["sour cream", "Dairy & eggs"],
    ["boneless chicken breast", "Meat"],
    ["ground beef", "Meat"],
    ["salmon fillets", "Seafood Counter"],
    ["anchovies", "Seafood Counter"],
    ["king crab", "Seafood Counter"],
    ["prosciutto", "Deli"],
    ["sliced turkey", "Deli"],
    ["canned black beans", "Canned"],
    ["canned tuna", "Canned"],
    ["tomato paste", "Canned"],
    ["chicken broth", "Canned"],
    ["white rice", "Rice, Pasta and Grains"],
    ["rolled oats", "Cereal & Breakfast"],
    ["lasagna noodles", "Rice, Pasta and Grains"],
    ["soy sauce", "International Aisle"],
    ["fish sauce", "International Aisle"],
    ["coconut milk", "International Aisle"],
    ["green curry paste", "International Aisle"],
    ["olive oil", "Oils & Condiments"],
    ["mustard, dijon", "Oils & Condiments"],
    ["ground cumin", "Spices"],
    ["baking powder", "Baking"],
    ["frozen peas", "Frozen"],
    ["frozen salmon", "Frozen"],
    ["white wine", "Beer, Wine & Spirits"],
    ["ground coffee", "Coffee & Tea"],
    ["black tea", "Coffee & Tea"],
    ["club soda", "Soda & Water"],
    ["sparkling water", "Soda & Water"],
    ["orange juice", "Juice"],
    ["breakfast cereal", "Cereal & Breakfast"],
    ["galactic unicorn flakes", null],
  ])("%s → %s", (name, aisle) => {
    expect(guessAisle(name)).toBe(aisle);
  });

  it("offers store departments instead of a Pantry or combined meat/fish aisle", () => {
    expect(DEFAULT_AISLES).toEqual(expect.arrayContaining([
      "Bakery", "Meat", "Seafood Counter", "Deli", "Canned",
      "Rice, Pasta and Grains", "International Aisle",
    ]));
    expect(DEFAULT_AISLES).not.toContain("Pantry");
    expect(DEFAULT_AISLES).not.toContain("Meat & fish");
    expect(DEFAULT_AISLES).not.toContain("Drinks");
  });

  it.each(["My aisle", "Pantry"])("keeps explicit %s assignments authoritative and leaves the document untouched", (aisle) => {
    const rec = { ingredients: [{ text: "rice", id: 1 }], aisles: { rice: aisle } };
    const before = JSON.stringify(rec);
    expect(buildList(rec, []).items[0].aisle).toBe(aisle);
    expect(JSON.stringify(rec)).toBe(before);
  });
});

describe("shopping names and aliases", () => {
  it("keeps the amount and removes comma-separated shopping/preparation notes", () => {
    const ingredient = parseIngredientText("3 onions, finely shopped, pick the nicest available");
    const list = buildList({ ingredients: [{ ...ingredient, id: 1 }] }, []);
    expect(list.items[0].name).toBe("Onions");
    expect(list.items[0].amounts[0].amount).toBe(3);
    expect(list.items[0].from[0].text).toContain("finely shopped, pick the nicest available");
  });

  it("uses stored ingredient keys before guessing a name", () => {
    expect(baseKey({ ingkey: "Onions", text: "large onion, finely chopped" })).toBe("onions");
  });

  it("merges remembered aliases without changing ingredient wording", () => {
    const rec = {
      ingredients: [
        { id: 1, ingkey: "red onion", text: "red onion, finely chopped", amount: { amount: 1, unit: "" } },
        { id: 2, ingkey: "yellow onion", text: "yellow onions, choose nice ones", amount: { amount: 2, unit: "" } },
      ],
      keyAliases: { "red onion": "onions", "yellow onion": "onions" },
    };
    const before = JSON.stringify(rec);
    const list = buildList(rec, []);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].name).toBe("Onions");
    expect(list.items[0].amounts[0].amount).toBe(3);
    expect(JSON.stringify(rec)).toBe(before);
  });
});
