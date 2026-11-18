import { describe, it, expect } from "vitest";
import { prepare, search, sourceLabels } from "./lib.js";

const rec = (o) => prepare({ title: "X", ingredients: [], text: [], categories: [], ...o });

describe("search by source", () => {
  const a = rec({ title: "Pancakes", sources: [{ name: "Milk Street" }] });
  const b = rec({ title: "Soup", sources: [{ url: "https://www.seriouseats.com/soup" }] });
  const c = rec({ title: "Stew" });
  it("matches a source name", () => {
    const hits = search([a, b, c], "milk");
    expect(hits.map((h) => h.recipe.title)).toEqual(["Pancakes"]);
    expect(hits[0].source).toBe("Milk Street");
  });
  it("matches the site of a link", () => {
    expect(search([a, b, c], "seriouseats").map((h) => h.recipe.title)).toEqual(["Soup"]);
  });
  it("labels sources: name first, else the site", () => {
    expect(sourceLabels(b)).toEqual(["seriouseats.com"]);
  });
});
