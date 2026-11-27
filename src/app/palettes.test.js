import { describe, expect, it } from "vitest";
import { wordColors, getColor } from "../common/colors.js";
import { palettes, paletteNames, paletteFor, automaticName, isPalette, paletteList, HOUSE } from "./palettes.js";

describe("the palettes a recipe can be given", () => {
  it("names every designed palette, plus the house one, each name unique", () => {
    expect(palettes.length).toBe(wordColors.length + 1);
    expect(new Set(paletteNames).size).toBe(paletteNames.length);
    expect(paletteNames).toContain(HOUSE);
    expect(paletteNames.every((name) => /^[a-z][a-z-]*$/.test(name))).toBe(true);
  });

  it("names them after their own words", () => {
    for (const name of ["chocolate", "christmas", "pumpkin", "japanese", "eggs", "pie"]) {
      expect(isPalette(name)).toBe(true);
    }
    // Renamed where the first word reads badly or is taken: the berry palette
    // matches "blueberr", and "chili" is already the chili-con-carne one.
    expect(isPalette("berry")).toBe(true);
    expect(isPalette("harissa")).toBe(true);
    expect(isPalette("blueberr")).toBe(false);
  });

  it("hands API clients a name and colours for each, and nothing else", () => {
    const list = paletteList();
    expect(list.length).toBe(palettes.length);
    expect(Object.keys(list[0]).sort()).toEqual(["accent", "bg", "fg", "name"]);
    expect(list.every((p) => /^(#|black|white)/.test(p.bg) && p.fg)).toBe(true);
  });
});

describe("which palette a recipe wears", () => {
  const carrot = { title: "Carrot Soup", ingredients: [{ text: "2 carrots" }] };

  it("reads it off the recipe when none is named, exactly as before", () => {
    expect(paletteFor(carrot)).toEqual(getColor(carrot));
    expect(paletteFor({ title: "Supper" })).toEqual(getColor({ title: "Supper" }));
    expect(automaticName(carrot)).toBe("carrot");
    expect(automaticName({ title: "Supper" })).toBe(HOUSE);
  });

  it("wears the one it names instead", () => {
    const named = paletteFor({ ...carrot, palette: "christmas" });
    expect(named).toEqual(palettes.find((p) => p.name === "christmas").color);
    expect(named).not.toEqual(getColor(carrot));
  });

  it("falls back to the automatic choice for a name it does not know, or none", () => {
    for (const palette of ["", null, undefined, "whatever", 7, {}]) {
      expect(paletteFor({ ...carrot, palette })).toEqual(getColor(carrot));
    }
  });

  it("can be asked for the house palette on purpose", () => {
    expect(paletteFor({ title: "Carrot Soup", palette: HOUSE })).toEqual(getColor(null));
  });
});
