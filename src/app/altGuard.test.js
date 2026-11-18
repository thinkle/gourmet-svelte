import { describe, it, expect } from "vitest";
import { whySkipped, reparseList } from "../../scripts/migrate/alt-guard.mjs";
import { reparseAltAmounts } from "../utils/ingredientParsing.js";

describe("migration guard: lines the re-read must leave alone", () => {
  const skipped = {
    "sticks (1 cup) unsalted butter, softened": "leftover-unit",
    "stick (8 tablespoons) unsalted butter": "leftover-unit",
    "cup/225 grams unsalted butter (2 sticks)": "leftover-unit",
    "jar (7oz) marshmallow creme": "leftover-unit",
    "or 2 shots (3 ounces) limoncello,": "leftover-unit",
    "(30 mL) minced gingerroot or 1 1/2 tsp (7 mL) ground ginger": "alternatives",
    "flour (17.5 ounces) or 4 cups (20 ounces) other flour": "alternatives",
    "yellow bell peppers, diced (21/2 cups)": "typo",
  };
  for (const [line, why] of Object.entries(skipped)) it(`${why}: ${line.slice(0, 40)}`, () => expect(whySkipped(line)).toBe(why));

  it("lets ordinary lines through", () => {
    for (const line of ["unsalted butter (2 sticks), cut up", "(1 stick) cold unsalted butter", "whole-wheat penne, rigatoni or fusilli (2 cups)",
      "all-purpose flour (3 3/4 cups)", "(2 sticks) butter or margarine, softened", "rustic bread (9 ounces), cut into cubes (5 cups)"]) {
      expect(whySkipped(line)).toBeNull();
    }
  });
});

describe("reparseList", () => {
  const list = [
    { text: "flour", amount: { amount: 240, unit: "g" } },
    { text: "BUTTER:", ingredients: [
      { text: "unsalted butter (2 1/2 sticks)", amount: { amount: 285, unit: "g" } },
      { text: "yellow peppers (21/2 cups)", amount: { amount: 1 } },
    ] },
  ];
  it("changes safe lines inside groups, reports them, leaves the rest, does not mutate the input", () => {
    const changes = [], skips = [];
    const next = reparseList(list, reparseAltAmounts, { report: (c) => changes.push(c), skip: (w) => skips.push(w) });
    expect(changes).toHaveLength(1);
    expect(next[1].ingredients[0].text).toBe("unsalted butter");
    expect(next[1].ingredients[0].altAmounts[0]).toMatchObject({ amount: 2.5, unit: "sticks" });
    expect(next[1].ingredients[1].text).toBe("yellow peppers (21/2 cups)");
    expect(skips).toEqual(["typo"]);
    expect(list[1].ingredients[0].text).toBe("unsalted butter (2 1/2 sticks)");
  });
});
