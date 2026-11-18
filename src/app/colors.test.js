import { describe, it, expect } from "vitest";
import { getColor, wordColors } from "../common/colors.js";

const bgOf = (re) => wordColors.find((w) => String(w.matcher) === String(re)).color.bg;
const r = (title, categories = [], ings = []) => ({ title, categories: categories.map((name) => ({ name })), ingredients: ings.map((text) => ({ text })) });

describe("getColor: title, then categories, then ingredients", () => {
  it("title beats a category even when the category's rule is earlier in the list", () => {
    expect(getColor(r("Beef Stew", ["Chocolate"])).bg).toBe(getColor(r("Beef Stew")).bg);
  });
  it("a title beats the ingredients: Beef Soup with carrots is not carrot", () => {
    expect(getColor(r("Beef Soup", [], ["2 carrots"])).bg).not.toBe(getColor(r("Carrot Soup")).bg);
  });
  it("within the title the list order decides: carrot before curry before soup", () => {
    const carrot = getColor(r("Carrot Soup")).bg;
    expect(getColor(r("Carrot Curry Soup")).bg).toBe(carrot);
    expect(getColor(r("Curry Soup")).bg).toBe("#1a1a1a");
  });
  it("categories before ingredients", () => {
    expect(getColor(r("Supper", ["Salmon"], ["carrots"])).bg).toBe("#fa8072");
  });
  it("ingredients only count for flagged rules", () => {
    expect(getColor(r("Supper", [], ["2 carrots"])).bg).toBe("#ed9121");
    expect(getColor(r("Supper", [], ["1 onion", "2 cloves garlic"])).bg).toBe("#7a4443"); // plain brown
  });
  it("pineapple is not apple; salmon and crab have their own colours, not the ocean's", () => {
    expect(getColor(r("Pineapple Salsa")).bg).toBe("#f4c430");
    expect(getColor(r("Salmon Cakes")).bg).toBe("#fa8072");
    expect(getColor(r("Crab Cakes")).bg).toBe("#b8201a");
    expect(getColor(r("Fish Tacos")).bg).toBe("#0077BE");
  });
  it("words are matched at their start: apple, not pineapple; chard, not orchard; frost, not frosting", () => {
    expect(getColor(r("Apple Crisp")).bg).toBe("#ff0800");
    expect(getColor(r("Orchard Fruit Salad")).bg).not.toBe(getColor(r("Swiss Chard Gratin")).bg);
    expect(getColor(r("Vanilla Frosting")).bg).toBe("#7a4443");
  });
});

describe("accent and the new fixes", () => {
  it("an accent defaults to the text colour; a palette can set its own", () => {
    expect(getColor(r("Beef Stew")).accent).toBe(getColor(r("Beef Stew")).fg);
    expect(getColor(r("Christmas Cookies")).accent).toBe("#c8102e");
    expect(getColor(r("Scrambled Eggs")).accent).toBe("#ffb800");
  });
  it("white cheeses are white, cheddar is not", () => {
    for (const t of ["Mozzarella Sticks", "Feta Wrap", "Pecorino Crisps", "Parmesan Crisps"]) expect(getColor(r(t)).bg).toBe("#f6f1e3");
    expect(getColor(r("Cheddar Biscuit")).bg).toBe("#ffa62b");
  });
  it("milk counts, Milk Street does not", () => {
    expect(getColor(r("Milk Toast")).bg).toBe("#eef2f7");
    expect(getColor(r("Lomo Saltado | Milk Street")).bg).toBe("#7a4443");
  });
  it("birthday is bubblegum", () => expect(getColor(r("Birthday Cake")).bg).toBe("#ff9ecb"));
});

describe("ink: the recipe colour as readable text", () => {
  it("keeps a colour that already reads, darkens one that does not", async () => {
    const { ink } = await import("./lib.js");
    const Color = (await import("color")).default;
    const page = Color("#fffdf8");
    expect(ink("#5c3317").toLowerCase()).toBe("#5c3317");
    for (const bg of ["#d7e869", "#fffdf5", "#ffe5b4", "#f0dc9c", "#b8f2e6"]) {
      expect(Color(ink(bg)).contrast(page)).toBeGreaterThanOrEqual(4.5);
    }
  });
});
