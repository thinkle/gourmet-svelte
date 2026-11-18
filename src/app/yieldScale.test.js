import { describe, it, expect } from "vitest";
import { floatToFrac } from "../utils/numbers.js";

// The yield box is a view of the multiplier: shown = base * mult, typed -> mult = typed / base.
describe("scaling to a yield", () => {
  const base = 24;
  it("30 for a recipe that makes 24 is x 1 1/4", () => {
    const mult = 30 / base;
    expect(mult).toBe(1.25);
    expect(floatToFrac(mult, { unicodeFractions: false })).toBe("1 1/4");
  });
  it("a multiplier of 2 shows 48", () => expect(base * 2).toBe(48));
  it("an odd target gives a cook's fraction", () => {
    expect(floatToFrac(20 / 24, { unicodeFractions: false })).toBe("5/6");
  });
});
