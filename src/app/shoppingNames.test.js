import { describe, it, expect } from "vitest";
import { itemName, baseKey, buildList } from "./shoppingList.js";
import { parseIngredientText } from "../utils/ingredientParsing.js";

const sugarNote = "adjusted for extra-tart or extra-sweet apples";

describe("shopping ingredient note boundaries", () => {
  it("excludes the semicolon note from the sugar name, aisle and pantry matching", () => {
    const ingredient = parseIngredientText(`1 1/4 cups white granulated sugar; ${sugarNote}`);
    const rec = { ingredients: [{ ...ingredient, id: 1 }] };
    const before = JSON.stringify(rec);
    const item = buildList(rec, []).items[0];

    expect(item.name).toBe("White Granulated Sugar");
    expect(item.key).toBe("white granulated sugar");
    expect(item.aisle).toBe("Baking");
    expect(item.state).toBe("have");
    expect(item.amounts[0].amount).toBe(1.25);
    expect(item.from[0].text).toContain(`white granulated sugar; ${sugarNote}`);
    expect(JSON.stringify(rec)).toBe(before);
  });

  it("combines ingredients with different semicolon notes under the same shopping key", () => {
    const rec = { ingredients: [
      { id: 1, text: "onions; finely chopped", amount: { amount: 2, unit: "" } },
      { id: 2, text: "onions; pick the nicest available", amount: { amount: 3, unit: "" } },
    ] };
    const list = buildList(rec, []);
    expect(list.items).toHaveLength(1);
    expect(list.items[0].name).toBe("Onions");
    expect(list.items[0].amounts[0].amount).toBe(5);
    expect(list.items[0].from.map((source) => source.text)).toEqual([
      "2 onions; finely chopped", "3 onions; pick the nicest available",
    ]);
  });

  it.each([",", ";", " -- ", " - "])("treats %s as a note boundary", (separator) => {
    expect(itemName({ text: `onions${separator} pick the nicest available` })).toBe("Onions");
  });

  it("does not truncate an explicit shopping item or stored ingredient key", () => {
    const ing = { text: `sugar; ${sugarNote}`, shopItem: "sugar; user's chosen label" };
    expect(itemName(ing)).toBe("sugar; user's chosen label");
    expect(baseKey({ ...ing, ingkey: "Sugar Key" })).toBe("sugar key");
  });

  it("does not turn a note-only malformed ingredient into an empty shopping name", () => {
    expect(itemName({ text: "; salt" }).trim()).toBe("Salt");
  });
});
