// The confirmation that stands between a full list and an empty one.
import { afterEach, describe, it, expect, vi } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import ClearListDialog from "../screens/shopping/ClearListDialog.svelte";

let component;
afterEach(async () => { if (component) await unmount(component); document.body.innerHTML = ""; });

const recipes = [{ id: "a", title: "Chili" }, { id: "b", title: "Cornbread" }];
const items = [{ id: 1, text: "2 lb onions" }, { id: 2, text: "ice cream" }, { id: 3, text: "limes" }];

function show(props = {}) {
  const onclear = vi.fn();
  component = mount(ClearListDialog, { target: document.body, props: { recipes, items, onclear, oncancel: vi.fn(), ...props } });
  flushSync();
  return { onclear };
}
const button = (start) => [...document.querySelectorAll("button")].find((b) => b.textContent.trim().startsWith(start));
const box = (label) => document.querySelector(`input[type=checkbox][aria-label="${label}"]`);
const uncheck = (label) => { const el = box(label); el.checked = false; el.dispatchEvent(new Event("change", { bubbles: true })); flushSync(); };

describe("clear-the-list confirmation", () => {
  it("counts both groups, ticks both, and names what it would remove", () => {
    show();
    expect(box("Clear 2 recipes").checked).toBe(true);
    expect(box("Clear 3 items added by hand").checked).toBe(true);
    expect(document.body.textContent).toContain("Chili, Cornbread");
    expect(document.body.textContent).toContain("2 lb onions, ice cream, limes");
    expect(button("Clear 2 recipes and 3 items")).toBeTruthy();
  });

  it("clears both groups when confirmed", () => {
    const { onclear } = show();
    button("Clear 2 recipes and 3 items").click();
    flushSync();
    expect(onclear).toHaveBeenCalledWith({ recipes: true, items: true });
  });

  it("follows the boxes: unticking recipes leaves the items alone", () => {
    const { onclear } = show();
    uncheck("Clear 2 recipes");
    expect(button("Clear 3 items")).toBeTruthy();
    button("Clear 3 items").click();
    flushSync();
    expect(onclear).toHaveBeenCalledWith({ recipes: false, items: true });
  });

  it("will not clear nothing", () => {
    const { onclear } = show();
    uncheck("Clear 2 recipes");
    uncheck("Clear 3 items added by hand");
    const clear = button("Clear");
    expect(clear.disabled).toBe(true);
    clear.click();
    flushSync();
    expect(onclear).not.toHaveBeenCalled();
  });

  it("offers only the group that has anything in it, in the singular when there is one", () => {
    show({ recipes: [{ id: "a", title: "Chili" }], items: [] });
    expect(box("Clear 1 recipe")).toBeTruthy();
    expect(document.querySelectorAll("input[type=checkbox][aria-label]").length).toBe(1);
    expect(button("Clear 1 recipe")).toBeTruthy();
  });

  it("summarises a long list of names", () => {
    show({ items: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ id: n, text: `item ${n}` })) });
    expect(document.body.textContent).toContain("item 1, item 2, item 3, item 4, item 5, and 2 more");
  });
});
