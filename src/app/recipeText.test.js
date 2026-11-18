import { describe, it, expect } from "vitest";
import { bodyHtml, sanitizeBody, scaleAmounts } from "./recipeText.js";
import { markIngredients } from "./lib.js";

const nb = (s) => s.replace(/ /g, " ");

describe("<amount> markup", () => {
  it("survives the sanitizer, attributes dropped", () => {
    expect(sanitizeBody("<p>Add <amount>2</amount> eggs.</p>")).toBe("<p>Add <amount>2</amount> eggs.</p>");
    expect(sanitizeBody('<p><amount onclick="x()" class="y">2</amount></p>')).toBe("<p><amount>2</amount></p>");
  });

  it("is kept in plain-text bodies, everything else is escaped", () => {
    expect(bodyHtml("Beat <amount>2</amount> eggs.\n\nBake for 20 minutes at <200 C."))
      .toBe("<p>Beat <amount>2</amount> eggs.</p>\n<p>Bake for 20 minutes at &lt;200 C.</p>");
  });

  it("is only re-formatted at ×1, not marked as scaled", () => {
    const html = "<p>Add <amount>1 1/2 cups</amount> milk, <amount>2</amount> eggs and bake 20 minutes.</p>";
    expect(nb(scaleAmounts(html, 1))).toBe("<p>Add <amount>1 ½ cups</amount> milk, <amount>2</amount> eggs and bake 20 minutes.</p>");
  });

  it("scales whole numbers, fractions, ranges and units; plain numbers never", () => {
    const html = "<p>Add <amount>2</amount> eggs, <amount>1 1/2 cups</amount> milk, <amount>2-3</amount> cloves, " +
      "<amount>1 cup</amount> sugar and <amount>113 g</amount> butter. Bake 20 minutes.</p>";
    expect(nb(scaleAmounts(html, 4 / 3))).toBe(
      '<p>Add <amount class="scaled">2 ⅔</amount> eggs, <amount class="scaled">2 cups</amount> milk, ' +
      '<amount class="scaled">2 ⅔–4</amount> cloves, <amount class="scaled">1 ⅓ cups</amount> sugar and ' +
      '<amount class="scaled">150 g</amount> butter. Bake 20 minutes.</p>');
    expect(nb(scaleAmounts("<amount>2 cups</amount>", 0.5))).toBe('<amount class="scaled">1 cup</amount>');
  });

  it("leaves a tag alone when it does not start with a number", () => {
    const html = "<p><amount>some</amount> salt, <amount><b>2</b></amount></p>";
    expect(scaleAmounts(html, 2)).toBe(html);
  });

  it("coexists with ingredient mentions", () => {
    const ings = [{ text: "eggs", amount: { amount: 2 } }, { text: "milk" }];
    const html = markIngredients(scaleAmounts(bodyHtml("<p>Beat <amount>2</amount> eggs into the milk.</p>"), 2), ings);
    expect(html).toBe('<p>Beat <amount class="scaled">4</amount> <ing target="eggs">eggs</ing> into the <ing target="milk">milk</ing>.</p>');
  });
});
