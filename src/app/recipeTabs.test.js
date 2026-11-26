import { describe, it, expect } from "vitest";
import { readRecipeTabs, writeRecipeTabs, hasRecipeTabs, loadTabSession, saveTabSession, bookmarkHash } from "./recipeTabs.js";

const recipes = [{ id: 244, _id: "server-a" }, { id: 246, _id: "server-b" }, { id: 249 }];

describe("open recipe bookmarks", () => {
  it("round trips tab order and active recipe using stable server IDs", () => {
    const hash = writeRecipeTabs("", [246, 244], 244, recipes);
    expect(new URLSearchParams(hash.slice(1)).get("recipes")).toBe("server-b,server-a");
    expect(readRecipeTabs(hash, recipes)).toEqual({ ids: [246, 244], tab: 244 });
    expect(readRecipeTabs(hash, [{ id: 1, _id: "server-a" }, { id: 2, _id: "server-b" }]))
      .toEqual({ ids: [2, 1], tab: 1 });
  });

  it("keeps saved local-only recipes, omits unsaved drafts, and falls back to search", () => {
    const hash = writeRecipeTabs("", [249, "new-1"], "new-1", recipes);
    expect(readRecipeTabs(hash, recipes)).toEqual({ ids: [249], tab: "search" });
    expect(hash).toContain("local%3A249");
  });

  it("restores search or shopping while recipes stay open", () => {
    for (const tab of ["search", "shopping"]) {
      expect(readRecipeTabs(writeRecipeTabs("", [244], tab, recipes), recipes))
        .toEqual({ ids: [244], tab });
    }
  });

  it("ignores duplicates, missing/deleted recipes and malformed references", () => {
    expect(readRecipeTabs("#recipes=server-a,missing,server-a,%ZZ&tab=missing", recipes))
      .toEqual({ ids: [244], tab: "search" });
    expect(readRecipeTabs("#recipes=server-a&tab=server-b", recipes).tab).toBe("search");
    expect(readRecipeTabs("", recipes)).toEqual({ ids: [], tab: "search" });
  });

  it("accepts numeric local IDs and preserves unrelated hash parameters", () => {
    expect(readRecipeTabs("#recipes=244,246,249&tab=246", recipes))
      .toEqual({ ids: [244, 246, 249], tab: 246 });
    expect(writeRecipeTabs("#other=keep&recipes=server-a&tab=server-a", [], "search", recipes))
      .toBe("#other=keep");
    expect(writeRecipeTabs("#recipes=server-a", [], "search", recipes)).toBe("");
  });
});

describe("per-browser-tab recipe sessions", () => {
  const storage = () => {
    const values = new Map();
    return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  };

  it("keeps two browser tabs' workspaces independent, with a separate session per account", () => {
    const a = storage(), b = storage();
    const first = writeRecipeTabs("", [244, 246], 246, recipes);
    const second = writeRecipeTabs("", [249], 249, recipes);
    saveTabSession("account-a", first, a);
    saveTabSession("account-a", second, b);
    saveTabSession("account-b", second, a);
    expect(readRecipeTabs(loadTabSession("account-a", a), recipes)).toEqual({ ids: [244, 246], tab: 246 });
    expect(readRecipeTabs(loadTabSession("account-a", b), recipes)).toEqual({ ids: [249], tab: 249 });
    expect(readRecipeTabs(loadTabSession("account-b", a), recipes)).toEqual({ ids: [249], tab: 249 });
    expect(loadTabSession("new-account", a)).toBe("");
  });

  it("does not crash navigation when browser storage is restricted", () => {
    const blocked = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("full"); } };
    expect(loadTabSession("account", blocked)).toBe("");
    expect(() => saveTabSession("account", "#tab=shopping", blocked)).not.toThrow();
  });

  it("recognizes explicit bookmark links but leaves unrelated fragments alone", () => {
    expect(hasRecipeTabs("#recipes=server-a&tab=server-a")).toBe(true);
    expect(hasRecipeTabs("#tab=search")).toBe(true);
    expect(hasRecipeTabs("#other=value")).toBe(false);
    expect(hasRecipeTabs("")).toBe(false);
  });

  it("makes an empty explicit bookmark override remembered tabs", () => {
    const hash = bookmarkHash("#other=keep", [], "search", recipes);
    expect(hasRecipeTabs(hash)).toBe(true);
    expect(readRecipeTabs(hash, recipes)).toEqual({ ids: [], tab: "search" });
    expect(new URLSearchParams(hash.slice(1)).get("other")).toBe("keep");
  });
});
