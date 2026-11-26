import { describe, it, expect } from "vitest";
import { buildList } from "./shoppingList.js";

const apples = { text: "apples", amount: { amount: 1, unit: "" } };
const ref = (reference) => ({ reference, amount: { amount: 1, unit: "recipe" } });

describe("shopping recipe links", () => {
  it("keeps distinct local recipe ids when titles are identical", () => {
    const recipes = [1, 2].map((id) => ({ id, title: "Apple dish", ingredients: [apples] }));
    const list = buildList({ ingredients: [ref(1), ref(2)] }, recipes);
    expect(list.items[0].from.map((source) => source.recipeId)).toEqual([1, 2]);
    expect(list.recipes.map((recipe) => recipe.recipe.id)).toEqual([1, 2]);
  });

  it("resolves a Mongo reference to the local id used by app tabs", () => {
    const recipe = { id: 42, _id: "remote-id", title: "Apple dish", ingredients: [apples] };
    const list = buildList({ ingredients: [ref("remote-id")] }, [recipe]);
    expect(list.items[0].from[0].recipeId).toBe(42);
    expect(list.recipes[0].recipe).toBe(recipe);
  });

  it("keeps the source recipe id aligned with the parent attribution through groups and references", () => {
    const recipes = [
      { id: 1, title: "Pie", ingredients: [{ text: "Filling", ingredients: [ref(2)] }] },
      { id: 2, title: "Apple filling", ingredients: [apples] },
    ];
    const source = buildList({ ingredients: [ref(1)] }, recipes).items[0].from[0];
    expect(source.title).toBe("Pie");
    expect(source.recipeId).toBe(1);
  });

  it("does not invent a recipe link for a loose item or a missing reference", () => {
    const list = buildList({ ingredients: [{ ...apples, id: 1 }, ref("missing")] }, []);
    expect(list.items[0].from[0].recipeId).toBeNull();
    expect(list.recipes[0].found).toBe(false);
    expect(list.recipes[0].recipe).toBeUndefined();
  });
});
