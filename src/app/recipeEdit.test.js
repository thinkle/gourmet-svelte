import { describe, it, expect } from "vitest";
import {
  canonical, same, changedFields, ingredientLine, parseLine, understood, parseDuration,
  materialize, ingredientsView, textView, tidy, moveLine, insertLine, removeLine, ungroup,
} from "./recipeEdit.js";

describe("structural comparison", () => {
  it("ignores key order and undefined keys", () => {
    expect(same({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true);
    expect(same({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(canonical([{ b: 1, a: 2 }])).toBe('[{"a":2,"b":1}]');
  });
  it("sees order in arrays and lists changed fields", () => {
    expect(same([1, 2], [2, 1])).toBe(false);
    expect(changedFields({ title: "a", rating: 2, x: 1 }, { title: "b", rating: 2 })).toEqual(["title", "x"]);
  });
});

describe("ingredient lines", () => {
  it("parses '1 1/2 cups flour, sifted' with the kept parser", () => {
    const ing = parseLine("1 1/2 cups flour, sifted");
    expect(ing).toMatchObject({ text: "flour, sifted", amount: { amount: 1.5, unit: "cups" } });
    expect(ingredientLine(ing)).toBe("1 1/2 cups flour, sifted");
    expect(understood(ing)).toEqual({ amount: "1 ½", unit: "cups", item: "flour, sifted" });
  });
  it("round-trips ranges and plain items", () => {
    const range = parseLine("1-2 tbsp oil");
    expect(range.amount).toMatchObject({ amount: 2, rangeAmount: 1, unit: "tbsp" });
    expect(ingredientLine(range)).toBe("1-2 tbsp oil");
    expect(parseLine(ingredientLine(range)).amount).toMatchObject({ amount: 2, rangeAmount: 1 });
    expect(ingredientLine(parseLine("salt to taste"))).toBe("salt to taste");
  });
  it("keeps the user's own keys (shopItem, reference, optional) when a line is re-parsed", () => {
    const old = { text: "chips", amount: { amount: 1, unit: "cup" }, originalText: "1 cup chips", shopItem: "chocolate", optional: true };
    const next = parseLine("2 cups chocolate chips", old);
    expect(next).toMatchObject({ shopItem: "chocolate", optional: true, text: "chocolate chips", amount: { amount: 2, unit: "cups" } });
    expect(next.originalText).toBe("2 cups chocolate chips");
  });
  it("shows strings and odd values as lines", () => {
    expect(ingredientLine("2 eggs")).toBe("2 eggs");
    expect(ingredientLine(null)).toBe("");
    expect(ingredientLine({ text: "pepper", amount: {} })).toBe("pepper");
    expect(ingredientLine({ text: "flour", amount: { unit: "pinch" } })).toBe("pinch flour");
  });
});

describe("times", () => {
  it("reads typed durations", () => {
    expect(parseDuration("1 hr 15 min")).toBe(4500);
    expect(parseDuration("23-27 minutes")).toBeGreaterThan(0);
    expect(parseDuration("a while")).toBe(0);
    expect(parseDuration(undefined)).toBe(0);
  });
});

describe("odd shapes", () => {
  it("are shown without being changed", () => {
    const ings = ["1 cup rice"];
    expect(ingredientsView(ings)).toBe(ings);
    expect(ingredientsView("1 cup rice\n\n2 cups water")).toEqual(["1 cup rice", "2 cups water"]);
    expect(ingredientsView(undefined)).toEqual([]);
    expect(textView("Just text")).toEqual([{ body: "Just text" }]);
    expect(textView(["a", { header: "h", body: "b" }])).toEqual([{ body: "a" }, { header: "h", body: "b" }]);
  });
  it("are made regular on request, and a regular value comes back as the same array", () => {
    const regular = [{ text: "x" }];
    expect(materialize("ingredients", regular)).toBe(regular);
    expect(materialize("ingredients", ["2 eggs", null])[0]).toMatchObject({ text: "eggs", amount: { amount: 2 } });
    expect(materialize("text", "Body")).toEqual([{ body: "Body" }]);
    expect(materialize("categories", ["Soup", { name: "Dinner" }])).toEqual([{ name: "Soup" }, { name: "Dinner" }]);
    expect(materialize("times", undefined)).toEqual([]);
  });
});

describe("tidy", () => {
  it("drops blank rows only in changed fields", () => {
    const original = { sources: [{ name: "" }], ingredients: [{ text: "a" }] };
    const draft = { sources: [{ name: "" }], ingredients: [{ text: "a" }, { text: "" }, { text: "G", ingredients: [{ text: " " }, { text: "b" }] }] };
    expect(tidy(draft, original)).toEqual({ sources: [{ name: "" }], ingredients: [{ text: "a" }, { text: "G", ingredients: [{ text: "b" }] }] });
  });
});

describe("moving lines through groups", () => {
  const make = () => [{ text: "a" }, { text: "G", ingredients: [{ text: "g1" }, { text: "g2" }] }, { text: "b" }];
  const names = (l) => l.map((x) => (x.ingredients ? `${x.text}[${x.ingredients.map((i) => i.text).join(",")}]` : x.text)).join(" ");

  it("down into a group, through it, and out the other side", () => {
    const l = make();
    let p = moveLine(l, [0], 1);
    expect(names(l)).toBe("G[a,g1,g2] b");
    expect(p).toEqual([0, 0]);
    p = moveLine(l, p, 1);
    p = moveLine(l, p, 1);
    expect(names(l)).toBe("G[g1,g2,a] b");
    p = moveLine(l, p, 1);
    expect(names(l)).toBe("G[g1,g2] a b");
    expect(p).toEqual([1]);
    p = moveLine(l, p, 1);
    expect(names(l)).toBe("G[g1,g2] b a");
    expect(moveLine(l, [2], 1)).toEqual([2]); // already last
  });
  it("up into a group from below, and out the top", () => {
    const l = make();
    let p = moveLine(l, [2], -1);
    expect(names(l)).toBe("a G[g1,g2,b]");
    expect(p).toEqual([1, 2]);
    p = moveLine(l, [1, 0], -1);
    expect(names(l)).toBe("a g1 G[g2,b]");
    expect(p).toEqual([1]);
  });
  it("moves a group as a whole", () => {
    const l = make();
    expect(moveLine(l, [1], -1)).toEqual([0]);
    expect(names(l)).toBe("G[g1,g2] a b");
  });
  it("inserts, removes and ungroups", () => {
    const l = make();
    expect(insertLine(l, [0])).toEqual([1]);
    expect(insertLine(l, [2])).toEqual([2, 0]); // after a group's name: its first line
    expect(insertLine(l, [2, 2])).toEqual([2, 3]);
    expect(insertLine(l, null)).toEqual([4]);
    expect(names(l)).toBe("a  G[,g1,g2,] b ");
    expect(removeLine(l, [2, 0])).toEqual([2]);
    expect(removeLine(l, [1])).toEqual([0]);
    ungroup(l, 1);
    expect(names(l)).toBe("a g1 g2  b ");
  });
});

describe("second units in the editor", () => {
  it("a line shows its second measure and reads it back", async () => {
    const { parseLine, ingredientLine } = await import("./recipeEdit.js");
    const ing = parseLine("285 g unsalted butter (2 1/2 sticks)");
    expect(ing.altAmounts?.[0]).toMatchObject({ amount: 2.5, unit: "sticks" });
    expect(ingredientLine(ing)).toBe("285 g (2 1/2 sticks) unsalted butter");
    expect(parseLine(ingredientLine(ing), ing).altAmounts?.[0]).toMatchObject({ amount: 2.5, unit: "sticks" });
  });
  it("retyping a line without a second measure drops the old one", async () => {
    const { parseLine } = await import("./recipeEdit.js");
    const old = { text: "butter", amount: { amount: 285, unit: "g" }, altAmounts: [{ amount: 2.5, unit: "sticks" }] };
    expect(parseLine("300 g butter", old).altAmounts).toBeUndefined();
  });
  it("findSecondUnits fixes stored lines with the measure still in the text, including in groups", async () => {
    const { findSecondUnits } = await import("./recipeEdit.js");
    const list = [
      { text: "flour", amount: { amount: 240, unit: "g" } },
      { text: "COFFEE BUTTER:", ingredients: [{ text: "unsalted butter (2 1/2 sticks)", amount: { amount: 285, unit: "g" } }] },
    ];
    const set = (p, v) => (p.length === 1 ? (list[p[0]] = v) : (list[p[0]].ingredients[p[1]] = v));
    expect(findSecondUnits(list, set)).toBe(1);
    expect(list[1].ingredients[0].text).toBe("unsalted butter");
    expect(list[1].ingredients[0].altAmounts[0]).toMatchObject({ amount: 2.5, unit: "sticks" });
    expect(findSecondUnits(list, set)).toBe(0);
  });
});

describe("stick and square are units", () => {
  it("read as the primary measure, with or without a second measure", async () => {
    const { parseLine } = await import("./recipeEdit.js");
    expect(parseLine("1 stick cinnamon").amount).toMatchObject({ amount: 1, unit: "stick", standardUnit: "stick" });
    expect(parseLine("2 squares unsweetened chocolate").amount).toMatchObject({ amount: 2, standardUnit: "square" });
    const b = parseLine("2 sticks (225 g) butter");
    expect(b.text).toBe("butter");
    expect(b.amount).toMatchObject({ amount: 2, standardUnit: "stick" });
    expect(b.altAmounts[0]).toMatchObject({ amount: 225, unit: "g" });
  });
});
