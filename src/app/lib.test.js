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

describe("importer-style sources: [{url}, {name}]", () => {
  const r = rec({ title: "Salad", sources: [
    { url: "http://www.americastestkitchen.com/recipes/1-salad?ref=x", name: "" },
    { "@type": "Organization", name: "America's Test Kitchen", url: "" },
  ] });
  it("puts the name first and joins it to the link", () => {
    expect(sourceLabels(r)).toEqual(["America's Test Kitchen"]);
  });
  it("is found by name or by site, and shows the name", () => {
    for (const q of ["america", "testkitchen"]) expect(search([r], q)[0].source).toBe("America's Test Kitchen");
  });
  it("shows the site for a name that is a link", () => {
    expect(sourceLabels(rec({ sources: [{ name: "https://www.bethcato.com/x/" }] }))).toEqual(["bethcato.com"]);
  });
});
