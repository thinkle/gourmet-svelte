import { describe, it, expect } from "vitest";
import units, { addAmounts, adjustAmountUnit, readabilityScore, getMultiplierConversion } from "../utils/unitAmounts.js";
import { buildList } from "./shoppingList.js";
import { formatAmount } from "../utils/numbers.js";

const total = (...amounts) => buildList({ ingredients: amounts.map((amount, id) => ({ id, text: "butter", amount })) }, []).items[0];
const a = (amount, unit, rangeAmount) => ({ amount, unit, ...(rangeAmount === undefined ? {} : { rangeAmount }) });

describe("shopping unit migration regressions", () => {
  it("retains actual unit/range pairs instead of comma-operator results", () => {
    expect(units.METRIC_RANGE).toEqual([1, 999]);
    for (const group of Object.values(units.UNIT_GROUPS)) {
      for (const [unit, range] of group) {
        expect(typeof unit).toBe("string");
        expect(range).toHaveLength(2);
        expect(typeof range[0]).toBe("number");
      }
    }
    expect(units.UNIT_GROUPS["imperial volume"]).toContainEqual(["c", [0.25, 8]]);
  });

  it.each([
    [[a(10, "Tbs"), a(10, "Tbs")], a(1.25, "c")],
    [[a(20, "Tbs")], a(1.25, "c")],
    [[a(1.5, "tsp"), a(1.5, "tsp")], a(1, "Tbs")],
    [[a(0.125, "tsp"), a(0.125, "tsp")], a(0.25, "tsp")],
    [[a(750, "g"), a(750, "g")], a(1.5, "kg")],
    [[a(500, "ml"), a(500, "ml")], a(1, "l")],
    [[a(15, "fl oz")], a(15, "fl oz")],
    [[a(2, "c")], a(2, "c")],
    [[a(80, "Tbs"), a(80, "Tbs")], a(10, "c")],
    [[a(128, "Tbs"), a(128, "Tbs")], a(1, "gallon")],
    [[a(1, "qt"), a(1, "qt")], a(2, "qt")],
    [[a(4, "qt")], a(1, "gallon")],
  ])("chooses readable totals for %j", (input, expected) => {
    const actual = total(...input).amounts[0];
    expect(actual.unit).toBe(expected.unit);
    expect(actual.amount).toBeCloseTo(expected.amount, 10);
    expect(actual.rangeAmount).toBeUndefined();
  });

  it("preserves ranges while combining mixed units, in either order", () => {
    const inputs = [a(2, "cups", 1), a(16, "Tbs")];
    for (const input of [inputs, [...inputs].reverse()]) {
      expect(total(...input).amounts).toEqual([{ ...a(3, "c", 2), text: "2–3 c" }]);
    }
  });

  it("preserves a singleton range and zero lower endpoint", () => {
    expect(total(a(32, "Tbs", 16)).amounts[0]).toMatchObject(a(2, "c", 1));
    const result = total(a(16, "Tbs", 0)).amounts[0];
    expect(result).toMatchObject(a(1, "c", 0));
    expect(result.text).toBe("0–1 c");
    expect(formatAmount(a(1, "c", 0))).toBe("0–1");
  });

  it("scores both endpoints instead of making the low end unreadable", () => {
    const result = total(a(16, "Tbs", 1)).amounts[0];
    expect(result.unit).toBe("Tbs");
    expect(result.rangeAmount).toBe(1);
    expect(result.amount).toBe(16);
  });

  it("retains zero quantities and adds zero lower bounds correctly", () => {
    expect(addAmounts([a(0, "c"), a(0, "c")])).toEqual([a(0, "c")]);
    expect(addAmounts([a(1, "c", 0), a(1, "c")])).toEqual([a(2, "c", 1)]);
    expect(addAmounts([a(2, "scoop", 0), a(3, "scoop", 1)])).toEqual([a(5, "scoop", 1)]);
    expect(total(a(0, "Tbs")).amounts[0].amount).toBe(0);
  });

  it("keeps unknown units and mass/volume separate, even for a known ingredient", () => {
    expect(addAmounts([a(2, "scoop"), a(3, "scoop"), a(1, "bag")])).toEqual([a(5, "scoop"), a(1, "bag")]);
    expect(addAmounts([a(2, "__proto__"), a(3, "__proto__")])).toEqual([a(5, "__proto__")]);
    expect(total(a(100, "g"), a(100, "ml")).amounts).toHaveLength(2);
    expect(adjustAmountUnit(a(2, "scoop"))).toEqual(a(2, "scoop"));
  });

  it("does not mutate inputs or original ingredient lines", () => {
    const input = [a(10, "Tbs"), a(10, "Tbs")];
    const before = JSON.stringify(input);
    const item = total(...input);
    expect(JSON.stringify(input)).toBe(before);
    expect(item.from.map((line) => line.text)).toEqual(["10 Tbs butter", "10 Tbs butter"]);
  });

  it("preserves physical quantities and input-order independence", () => {
    const input = [a(1, "cup"), a(4, "Tbs"), a(3, "tsp")];
    const forward = total(...input).amounts[0];
    const reverse = total(...[...input].reverse()).amounts[0];
    expect(reverse).toEqual(forward);
    const tablespoons = input.reduce((sum, x) => sum + x.amount * getMultiplierConversion(x.unit, "Tbs"), 0);
    expect(forward.amount * getMultiplierConversion(forward.unit, "Tbs")).toBeCloseTo(tablespoons, 10);
  });

  it("applies scaling before summing ranges and leaves recipes unchanged", () => {
    const recipe = { id: 1, title: "Test", ingredients: [{ text: "butter", amount: a(16, "Tbs", 8) }] };
    const list = { ingredients: [{ reference: 1, amount: { amount: 2 } }] };
    const before = JSON.stringify([recipe, list]);
    expect(buildList(list, [recipe]).items[0].amounts[0]).toMatchObject(a(2, "c", 1));
    expect(JSON.stringify([recipe, list])).toBe(before);
  });

  it("retains Python fraction scores and optional current-unit bias", () => {
    expect(readabilityScore(1, "c")).toBeGreaterThan(readabilityScore(0.8, "c"));
    expect(readabilityScore(1 / 3, "tsp")).toBeGreaterThan(readabilityScore(0.123, "tsp"));
    expect(adjustAmountUnit(a(3, "tsp"))).toEqual(a(3, "tsp"));
    const adjusted = adjustAmountUnit(a(3, "tsp"), { favorCurrentUnit: false });
    expect(adjusted.unit).toBe("Tbs");
    expect(adjusted.amount).toBeCloseTo(1, 12);
  });
});
