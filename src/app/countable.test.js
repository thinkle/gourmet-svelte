import { describe, it, expect } from "vitest";
import { countableOf, countables, nounFor } from "./countable.js";
import { parseLine } from "./recipeEdit.js";

const L = (s) => parseLine(s);
describe("countable ingredients", () => {
  it("finds eggs however they are written", () => {
    for (const s of ["3 large eggs", "2 eggs", "1 egg, lightly beaten", "4 large eggs, hard-cooked, quartered"]) expect(countableOf(L(s))?.key).toBe("egg");
  });
  it("yolks and whites are their own thing", () => {
    expect(countableOf(L("3 egg yolks"))?.key).toBe("egg yolk");
    expect(countableOf(L("2 egg whites"))?.key).toBe("egg white");
  });
  it("garlic counts by the clove, not by the head or the teaspoon", () => {
    expect(countableOf(L("3 cloves garlic, minced"))?.key).toBe("garlic clove");
    expect(countableOf(L("1 tsp garlic powder"))).toBeNull();
  });
  it("things measured by volume or weight are not counts", () => {
    for (const s of ["1 cup chopped onion", "2 tablespoons lemon juice", "8 ounces egg noodles", "200 g potatoes", "1 tsp lemon zest"]) expect(countableOf(L(s))).toBeNull();
  });
  it("a lemon, juiced, is a lemon", () => expect(countableOf(L("1 lemon, juiced"))?.key).toBe("lemon"));
  it("sums a noun across lines, eggs first, at most two", () => {
    const r = { ingredients: [L("2 onions"), L("3 large eggs"), { text: "FOR THE TOP", ingredients: [L("1 egg, beaten")] }, L("2 bananas"), L("1 cup flour")] };
    const c = countables(r);
    expect(c.map((x) => [x.key, x.base])).toEqual([["egg", 4], ["onion", 2]]);
  });
  it("noun agrees with the count", () => {
    const egg = { one: "egg", many: "eggs" };
    expect(nounFor(egg, 1)).toBe("egg");
    expect(nounFor(egg, 4)).toBe("eggs");
    expect(nounFor(egg, 1.5)).toBe("eggs");
  });
});
