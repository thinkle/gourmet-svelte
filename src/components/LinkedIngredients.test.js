import { describe, it, expect, afterEach, vi } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import Ingredients from "../screens/recipe/Ingredients.svelte";
let component;
afterEach(async () => { if (component) await unmount(component); document.body.innerHTML = ""; });
function show(props) {
  component = mount(Ingredients, { target: document.body, props });
  flushSync();
}
describe("recipe ingredient links", () => {
  it("opens the exact referenced recipe through groups, with a native keyboard-accessible button", () => {
    const recipes = [{ id: 1, _id: "target", title: "Filling" }, { id: 2, _id: "other", title: "Filling" }];
    const onopen = vi.fn(), onpick = vi.fn();
    show({ recipes, onopen, onpick, list: [{ text: "For the pie", ingredients: [{ text: "Filling", reference: "target" }] }] });
    const link = document.querySelector("button.linked-recipe");
    expect(link.getAttribute("aria-label")).toBe("Open recipe Filling");
    link.focus();
    expect(document.activeElement).toBe(link);
    link.click();
    expect(onopen).toHaveBeenCalledWith(recipes[0]);
    expect(onpick).not.toHaveBeenCalled();
  });
  it("keeps ordinary ingredient highlighting and explains unavailable recipes", () => {
    const onpick = vi.fn();
    show({ list: [{ text: "apples" }, { text: "Missing filling", reference: "missing" }], onpick });
    document.querySelector("button").click();
    expect(onpick).toHaveBeenCalledWith("apples");
    expect(document.querySelectorAll("button")).toHaveLength(1);
    expect(document.body.textContent).toContain("recipe unavailable");
  });
  it("resolves a desktop local ID without relying on titles", () => {
    const recipe = { id: 7, title: "Dough" }, onopen = vi.fn();
    show({ recipes: [recipe], onopen, list: [{ text: "Dough", reference: 7 }] });
    document.querySelector("button").click();
    expect(onopen).toHaveBeenCalledWith(recipe);
  });
});
