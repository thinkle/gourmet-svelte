import { describe, it, expect, vi, beforeEach } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { RecipeEdit } from "./editState.svelte.js";

// ── Recipes to edit ─────────────────────────────────────────────────

const EMPTY = {};
// Shapes found in old and agent-written data.
const MALFORMED = {
  id: 7,
  title: "Toast",
  ingredients: ["2 slices bread", "butter"],
  text: "Toast the bread.\n\nButter it.",
  categories: ["Breakfast"],
};
const NO_FIELDS = { id: 8 };
const FULL = {
  _id: "abc-123",
  id: 12,
  title: "Coffee Blondies",
  categories: [{ name: "Dessert" }, { name: "Bars" }],
  sources: [{ name: "Grandma", url: "https://example.com/blondies" }],
  yields: [{ amount: 24, unit: "bars" }],
  times: [{ name: "Bake", seconds: 1500, text: "23-27 minutes" }],
  rating: 8,
  ingredients: [
    { text: "flour", amount: { amount: 1.5, unit: "cups", standardUnit: "c." }, originalText: "1 1/2 cups flour" },
    { text: "FOR THE GLAZE:", ingredients: [{ text: "chocolate chips", amount: { amount: 0.5, unit: "cup" }, shopItem: "chocolate" }] },
    { text: "salt", optional: true },
  ],
  // Odd but valid HTML that a sanitizer or editor might "fix": attribute
  // order, entities, unclosed <p>, a style attribute, a comment.
  text: [
    { header: "Instructions", body: '<p class="x" style="color:red">Heat &amp; stir<br>then <b>bake</b><p>Cool<!-- note --></p>' },
    { body: "Plain text body\n1. one\n2. two" },
  ],
  images: [{ url: "data:image/png;base64,AAAA", thumbnailUrl: "data:image/png;base64,BBBB" }],
  last_modified: 1700000000000,
  savedRemote: 1,
  share: 0,
  deleted: 0,
  words: ["coffee", "blondies"],
};

// The fixture file (gitignored), when there is one: real stored recipes.
const fixturePath = new URL("./fixtures.local.json", import.meta.url);
const FIXTURES = existsSync(fixturePath) ? JSON.parse(readFileSync(fixturePath, "utf8")) : [];

const SAMPLES = { EMPTY, MALFORMED, NO_FIELDS, FULL };

// ── A data layer that records what it is handed ──────────────────────

function fakeData({ fail = false, remote = true } = {}) {
  let nextId = 100;
  const calls = [];
  const data = {
    calls,
    fail,
    async updateRecipe(r, stamp = true) {
      calls.push({ op: "update", json: JSON.stringify(r), stamp });
      if (data.fail) throw new Error("Network down");
      // Like the kept layer: mutates and returns what it was handed.
      if (stamp) r.last_modified = 1800000000000;
      r.savedRemote = remote ? 1 : 0;
      return r;
    },
    async addRecipe(r) {
      calls.push({ op: "add", json: JSON.stringify(r) });
      if (data.fail) throw new Error("Network down");
      r.id = nextId++;
      if (remote) r.savedRemote = true;
      return r;
    },
  };
  return data;
}

const deferred = () => {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
};

describe("RecipeEdit: loading", () => {
  for (const [name, recipe] of Object.entries(SAMPLES)) {
    it(`${name}: starts clean, as an exact copy, without touching the input`, () => {
      const before = JSON.stringify(recipe);
      const e = new RecipeEdit(recipe, { data: fakeData() });
      expect(e.dirty).toBe(false);
      expect(e.changed).toEqual([]);
      expect(JSON.stringify(e.snapshot())).toBe(before);
      expect(e.snapshot()).not.toBe(recipe);
      e.set("title", "Changed");
      expect(JSON.stringify(recipe)).toBe(before);
    });
  }
  it("knows a recipe that was never stored", () => {
    expect(new RecipeEdit({ title: "" }).isNew).toBe(true);
    expect(new RecipeEdit({ id: 0 }).isNew).toBe(false); // 0 is a valid local id
  });
});

describe("RecipeEdit: dirty is structural", () => {
  it("an edit makes it dirty, and undoing the edit by hand makes it clean", () => {
    const e = new RecipeEdit(FULL, { data: fakeData() });
    e.set("title", "Better Blondies");
    expect(e.dirty).toBe(true);
    expect(e.changed).toEqual(["title"]);
    e.set("title", FULL.title);
    expect(e.dirty).toBe(false);
  });
  it("sees a change deep inside a group", () => {
    const e = new RecipeEdit(FULL, { data: fakeData() });
    e.list("ingredients")[1].ingredients[0].text = "white chocolate chips";
    expect(e.dirty).toBe(true);
    expect(e.changed).toEqual(["ingredients"]);
  });
  it("ignores key order", () => {
    const e = new RecipeEdit(FULL, { data: fakeData() });
    const [first] = e.list("ingredients");
    e.list("ingredients")[0] = { originalText: first.originalText, amount: { ...first.amount }, text: first.text };
    expect(e.dirty).toBe(false);
  });
  it("sees a reorder", () => {
    const e = new RecipeEdit(FULL, { data: fakeData() });
    const ings = e.list("ingredients");
    ings.push(ings.shift());
    expect(e.dirty).toBe(true);
  });
  it("sees a field added to a recipe that had none", () => {
    const e = new RecipeEdit(NO_FIELDS, { data: fakeData() });
    e.list("categories").push({ name: "Soup" });
    expect(e.changed).toEqual(["categories"]);
  });
});

describe("RecipeEdit: saving", () => {
  for (const [name, recipe] of Object.entries(SAMPLES)) {
    it(`${name}: an untouched recipe is handed to the data layer byte-identical`, async () => {
      const data = fakeData();
      const e = new RecipeEdit(recipe, { data });
      await e.save();
      const isNew = recipe.id === undefined;
      expect(data.calls[0].op).toBe(isNew ? "add" : "update");
      // A new recipe also carries the "upload me at the next sync" mark.
      expect(data.calls[0].json).toBe(JSON.stringify(isNew ? { ...recipe, savedRemote: 0 } : recipe));
    });
  }

  it("every fixture recipe saves back unchanged when untouched", async () => {
    for (const recipe of FIXTURES) {
      const data = fakeData();
      const e = new RecipeEdit(recipe, { data });
      expect(e.dirty).toBe(false);
      await e.save();
      expect(data.calls[0].json).toBe(JSON.stringify(recipe));
    }
  });

  it("an edited recipe is saved with exactly that edit, and is then clean", async () => {
    const data = fakeData();
    const e = new RecipeEdit(FULL, { data });
    e.set("title", "Better Blondies");
    const saved = await e.save();
    const sent = JSON.parse(data.calls[0].json);
    expect(sent).toEqual({ ...FULL, title: "Better Blondies" });
    expect(saved.title).toBe("Better Blondies");
    expect(e.status).toBe("saved");
    expect(e.dirty).toBe(false);
    // The original is what was stored, stamped by the data layer.
    expect(e.original.last_modified).toBe(1800000000000);
  });

  it("does not let the data layer's mutations reach the draft", async () => {
    const data = fakeData();
    const e = new RecipeEdit(FULL, { data });
    e.set("title", "X");
    const before = e.snapshot();
    data.updateRecipe = async (r) => { data.calls.push({ json: JSON.stringify(r) }); r.title = "mangled"; throw new Error("nope"); };
    await e.save();
    expect(e.snapshot()).toEqual(before);
  });

  it("save failed: stays dirty, keeps the draft, shows the error, can retry", async () => {
    const data = fakeData({ fail: true });
    const e = new RecipeEdit(FULL, { data });
    e.set("title", "Better Blondies");
    const result = await e.save();
    expect(result).toBe(null);
    expect(e.status).toBe("error");
    expect(e.error).toMatch(/Network down/);
    expect(e.dirty).toBe(true);
    expect(e.draft.title).toBe("Better Blondies");
    data.fail = false;
    await e.save();
    expect(e.status).toBe("saved");
    expect(e.error).toBe(null);
    expect(e.dirty).toBe(false);
    expect(e.original.title).toBe("Better Blondies");
  });

  it("keeps what was typed while a save was in flight", async () => {
    const gate = deferred();
    const data = fakeData();
    const real = data.updateRecipe;
    data.updateRecipe = async (r, s) => { await gate.promise; return real(r, s); };
    const e = new RecipeEdit(FULL, { data });
    e.set("title", "One");
    const saving = e.save();
    expect(e.status).toBe("saving");
    e.set("title", "Two");
    gate.resolve();
    await saving;
    expect(e.original.title).toBe("One");
    expect(e.draft.title).toBe("Two");
    expect(e.dirty).toBe(true);
  });

  it("ignores a second save while one is running", async () => {
    const gate = deferred();
    const data = fakeData();
    const real = data.updateRecipe;
    data.updateRecipe = async (r, s) => { data.calls.push("x"); await gate.promise; return real(r, s); };
    const e = new RecipeEdit(FULL, { data });
    e.set("title", "One");
    const first = e.save();
    expect(await e.save()).toBe(null);
    gate.resolve();
    await first;
    expect(data.calls.filter((c) => c === "x")).toHaveLength(1);
  });

  it("a new recipe is added once, marked for upload in case the server is not reached", async () => {
    const data = fakeData({ remote: false });
    const e = new RecipeEdit({ title: "", ingredients: [], text: [] }, { data });
    e.set("title", "New soup");
    await e.save();
    expect(data.calls.map((c) => c.op)).toEqual(["add"]);
    expect(JSON.parse(data.calls[0].json)).toEqual({ title: "New soup", ingredients: [], text: [], savedRemote: 0 });
    expect(e.isNew).toBe(false);
    expect(e.original.id).toBe(100);
    expect(e.localOnly).toBe(true);
  });

  it("a new recipe saved to the server is added once", async () => {
    const data = fakeData();
    const e = new RecipeEdit({ title: "" }, { data });
    e.set("title", "New soup");
    await e.save();
    expect(data.calls.map((c) => c.op)).toEqual(["add"]);
    expect(e.localOnly).toBe(false);
  });

  it("drops blank rows the user left, only in fields they changed", async () => {
    const withBlank = { ...FULL, sources: [{ name: "", url: "" }, ...FULL.sources] };
    const data = fakeData();
    const e = new RecipeEdit(withBlank, { data });
    e.list("ingredients").push({ text: "" });
    e.list("times").push({ name: "", text: "" });
    await e.save();
    const sent = JSON.parse(data.calls[0].json);
    expect(sent.ingredients).toEqual(FULL.ingredients);
    expect(sent.times).toEqual(FULL.times);
    expect(sent.sources).toEqual(withBlank.sources); // untouched: kept as stored
  });
});

describe("RecipeEdit: revert", () => {
  for (const [name, recipe] of Object.entries(SAMPLES)) {
    it(`${name}: restores exactly what was loaded`, () => {
      const e = new RecipeEdit(recipe, { data: fakeData() });
      e.set("title", "Something else");
      e.list("ingredients").push({ text: "pepper" });
      e.list("text").push({ header: "More", body: "<p>x</p>" });
      e.list("categories").push({ name: "Odd" });
      expect(e.dirty).toBe(true);
      e.revert();
      expect(e.dirty).toBe(false);
      expect(JSON.stringify(e.snapshot())).toBe(JSON.stringify(recipe));
    });
  }
  it("after a save, reverts to the saved version", async () => {
    const e = new RecipeEdit(FULL, { data: fakeData() });
    e.set("title", "Saved title");
    await e.save();
    e.set("title", "Unsaved");
    e.revert();
    expect(e.draft.title).toBe("Saved title");
  });
  it("clears a save error", async () => {
    const e = new RecipeEdit(FULL, { data: fakeData({ fail: true }) });
    e.set("title", "x");
    await e.save();
    e.revert();
    expect(e.status).toBe("idle");
    expect(e.error).toBe(null);
  });
});

describe("RecipeEdit: malformed recipes", () => {
  it("shows odd shapes without converting them, and converts on first edit", () => {
    const e = new RecipeEdit(MALFORMED, { data: fakeData() });
    expect(e.draft.ingredients).toEqual(["2 slices bread", "butter"]);
    const ings = e.list("ingredients");
    expect(ings[0]).toMatchObject({ text: "bread", amount: { amount: 2, unit: "slices" } });
    expect(ings[1]).toMatchObject({ text: "butter" });
    expect(e.list("text")).toEqual([{ body: MALFORMED.text }]);
    expect(e.list("categories")).toEqual([{ name: "Breakfast" }]);
    expect(e.changed).toEqual(["categories", "ingredients", "text"]);
  });
  it("a whole ingredient list stored as one string becomes lines", () => {
    const e = new RecipeEdit({ id: 3, ingredients: "1 cup rice\n2 cups water" }, { data: fakeData() });
    expect(e.list("ingredients").map((i) => i.text)).toEqual(["rice", "water"]);
  });
  it("missing fields appear as empty lists only when edited", () => {
    const e = new RecipeEdit(NO_FIELDS, { data: fakeData() });
    expect(e.draft.ingredients).toBeUndefined();
    expect(e.list("ingredients")).toEqual([]);
    expect(e.dirty).toBe(true); // [] where there was nothing
  });
});

describe("RecipeEdit: delete", () => {
  it("soft-deletes the stored version, not the draft", async () => {
    const data = fakeData();
    const e = new RecipeEdit(FULL, { data });
    e.set("title", "unsaved edit");
    expect(await e.remove()).toBe(true);
    const sent = JSON.parse(data.calls[0].json);
    expect(sent).toEqual({ ...FULL, deleted: true });
  });
  it("reports a failed delete", async () => {
    const e = new RecipeEdit(FULL, { data: fakeData({ fail: true }) });
    expect(await e.remove()).toBe(false);
    expect(e.status).toBe("error");
  });
  it("a recipe never saved has nothing to delete", async () => {
    const data = fakeData();
    expect(await new RecipeEdit({ title: "" }, { data }).remove()).toBe(true);
    expect(data.calls).toEqual([]);
  });
});

// ── Through Gourmet's real data layer, with no one signed in ─────────

describe("RecipeEdit with the kept recipeData (no user)", () => {
  let recipeData, dexie;
  beforeEach(async () => {
    vi.resetModules();
    globalThis.fetch = vi.fn(() => { throw new Error("no network in tests"); });
    recipeData = (await import("../data/recipeData.js")).default;
    dexie = (await import("../data/local/dexieApi.js")).default;
    await dexie.connect();
    await dexie.db.recipes.clear();
  });

  // Fields the local cache adds for its own indexes (prepRecLocal), and the
  // two the save itself stamps.
  const LOCAL = ["words", "ings", "categoryNames", "sourceNames", "deleted", "share", "last_modified", "savedRemote"];
  const strip = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => !LOCAL.includes(k)));

  it("saves only to the local cache, marked for upload, with bodies untouched", async () => {
    await dexie.db.recipes.put(structuredClone(FULL));
    const row = await dexie.getRecipe(12);
    const e = new RecipeEdit(row, { data: recipeData });
    await e.save();
    expect(e.status).toBe("saved");
    expect(globalThis.fetch).not.toHaveBeenCalled();
    const stored = await dexie.getRecipe(12);
    expect(stored.savedRemote).toBe(0);
    expect(e.localOnly).toBe(true);
    expect(strip(stored)).toEqual(strip(FULL));
    expect(stored.text.map((t) => t.body)).toEqual(FULL.text.map((t) => t.body));
  });

  it("an edit is in the local cache afterwards", async () => {
    await dexie.db.recipes.put(structuredClone(FULL));
    const e = new RecipeEdit(await dexie.getRecipe(12), { data: recipeData });
    e.set("title", "Edited offline");
    await e.save();
    expect((await dexie.getRecipe(12)).title).toBe("Edited offline");
    expect(e.dirty).toBe(false);
  });

  it("creates a new recipe locally and marks it for the next sync", async () => {
    const e = new RecipeEdit({ title: "", ingredients: [], text: [] }, { data: recipeData });
    e.set("title", "Brand new");
    await e.save();
    expect(e.isNew).toBe(false);
    const stored = await dexie.getRecipe(e.original.id);
    expect(stored.title).toBe("Brand new");
    expect(stored.savedRemote).toBe(0);
    expect((await dexie.getRecipes({ query: { savedRemote: 0 } })).count).toBe(1);
  });

  it("soft-deletes in the local cache", async () => {
    await dexie.db.recipes.put(structuredClone(FULL));
    const e = new RecipeEdit(await dexie.getRecipe(12), { data: recipeData });
    await e.remove();
    expect((await dexie.getRecipe(12)).deleted).toBe(1);
  });
});
