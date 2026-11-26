import { describe, it, expect } from "vitest";
import { buildList } from "./shoppingList.js";

const ref = (reference, amount = 1) => ({ text: "Linked recipe", reference, amount: { amount } });
const leaf = { text: "apples", amount: { amount: 2, unit: "kg", rangeAmount: 1 } };
const list = (recipes, entries = [ref("a")]) => buildList({ ingredients: entries }, recipes);

describe("linked recipe shopping expansion", () => {
  it.each([false, true])("follows a grouped, three-level chain with API-only IDs: local IDs %s", (local) => {
    const recipes = [
      { _id: "a", ingredients: [{ text: "Filling", ingredients: [ref("b", 2)] }] },
      { _id: "b", ingredients: [ref("c", 0.5)] },
      { _id: "c", ingredients: [leaf] },
    ].map((r, i) => ({ ...r, title: r._id, ...(local ? { id: i + 1 } : {}) }));
    const before = JSON.stringify(recipes);
    const result = list(recipes, [ref("a", 3)]);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].amounts[0]).toMatchObject({ amount: 6, rangeAmount: 3, unit: "kg" });
    expect(result.items[0].from[0].title).toBe("a");
    expect(JSON.stringify(recipes)).toBe(before);
  });

  it("skips direct and indirect cycles but counts independent repeated branches", () => {
    const recipes = [
      { _id: "a", ingredients: [ref("a"), ref("b"), ref("b")] },
      { _id: "b", ingredients: [leaf, ref("c")] },
      { _id: "c", ingredients: [ref("a"), { text: "pears" }] },
    ];
    const result = list(recipes);
    expect(result.items).toHaveLength(2);
    expect(result.items.find((i) => i.key === "apples").amounts[0].amount).toBe(4);
    expect(result.items.find((i) => i.key === "pears").from).toHaveLength(2);
  });

  it("handles mixed local and remote references along the same cycle", () => {
    const recipes = [
      { id: 1, _id: "a", ingredients: [ref(2)] },
      { id: 2, _id: "b", ingredients: [leaf, ref("a")] },
    ];
    expect(list(recipes).items[0].amounts[0].amount).toBe(2);
  });

  it("skips unavailable targets and still includes the other ingredients", () => {
    expect(list([{ _id: "a", ingredients: [ref("missing"), leaf] }]).items).toHaveLength(1);
  });

  it("uses one batch by default and respects explicit zero multipliers", () => {
    const recipes = [{ _id: "a", ingredients: [{ reference: "b", text: "Filling" }] }, { _id: "b", ingredients: [leaf] }];
    expect(list(recipes).items[0].amounts[0].amount).toBe(2);
    expect(list(recipes, [ref("a", 0)]).items[0].amounts[0].amount).toBe(0);
    recipes[0].ingredients[0].amount = { amount: 0 };
    expect(list(recipes).items[0].amounts[0].amount).toBe(0);
  });
});
