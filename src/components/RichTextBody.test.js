import { describe, it, expect, afterEach } from "vitest";
import { mount, unmount, flushSync } from "svelte";
import { existsSync, readFileSync } from "node:fs";
import RichTextBody from "./RichTextBody.svelte";
import { sanitizeBody, bodyHtml } from "../app/recipeText.js";
import { RecipeEdit } from "../app/editState.svelte.js";

// Bodies that a sanitizer or an editor would be tempted to "fix".
const BODIES = [
  '<p class="x" style="color:red">Heat &amp; stir<br>then <b>bake</b><p>Cool<!-- note --></p>',
  "<div><font face=Arial>Old</font> import</div><script>alert(1)</script>",
  "Plain text\n\n1. one\n2. two",
  "<ol><li>Step</li></ol>\n<p>  spaced  </p>",
  "",
];

// Optional: every body in a dump of real recipes (R3-5). Point
// GOURMET_DUMP at a JSON array of recipes on disk; never commit it.
const fixtureFile = new URL("../app/fixtures.local.json", import.meta.url);
const dump = process.env.GOURMET_DUMP ?? (existsSync(fixtureFile) ? fixtureFile : null);
const REAL = dump ? JSON.parse(readFileSync(dump, "utf8")) : [];

let mounted = [];
afterEach(() => { mounted.forEach((c) => unmount(c)); mounted = []; document.body.innerHTML = ""; });

function show(body, onchange) {
  const target = document.createElement("div");
  document.body.append(target);
  mounted.push(mount(RichTextBody, { target, props: { body, onchange } }));
  flushSync();
  return target.querySelector("[contenteditable]");
}

describe("RichTextBody: no write unless edited", () => {
  for (const body of BODIES) {
    it(`shows ${JSON.stringify(body.slice(0, 30))} without writing it back`, () => {
      const writes = [];
      const el = show(body, (html) => writes.push(html));
      el.dispatchEvent(new FocusEvent("focus"));
      el.dispatchEvent(new FocusEvent("blur"));
      expect(el.innerHTML).toBe(bodyHtml(body));
      expect(writes).toEqual([]);
    });
  }

  it("never puts unsafe markup in the page", () => {
    const el = show('<img src=x onerror="alert(1)"><script>alert(2)</script><a href="javascript:alert(3)">x</a>');
    expect(el.innerHTML).not.toMatch(/onerror|script|javascript:/);
  });

  it("writes the cleaned HTML once the user types", () => {
    const writes = [];
    const el = show("<p>Stir</p>", (html) => writes.push(html));
    el.innerHTML = '<p>Stir <span style="color:red">well</span></p>';
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(writes).toEqual(["<p>Stir <span>well</span></p>"]);
  });
});

describe("Text bodies through the edit state", () => {
  it("an untouched recipe with every kind of body saves back byte-identical", async () => {
    const recipes = [{ id: 1, text: BODIES.map((body, i) => ({ header: `H${i}`, body })) }, ...REAL];
    for (const recipe of recipes) {
      let sent = null;
      const edit = new RecipeEdit(recipe, { data: { async updateRecipe(r) { sent = JSON.stringify(r); return r; } } });
      // Show every body in the editor, as the screen does.
      for (const block of [].concat(recipe.text ?? [])) show(typeof block === "string" ? block : block?.body);
      expect(edit.dirty).toBe(false);
      await edit.save();
      expect(sent).toBe(JSON.stringify(recipe));
    }
  });
});

describe("sanitizeBody", () => {
  it("is stable on its own output (cleaning twice changes nothing)", () => {
    for (const body of [...BODIES, ...REAL.flatMap((r) => [].concat(r.text ?? []).map((t) => t?.body ?? ""))]) {
      const once = sanitizeBody(bodyHtml(body));
      expect(sanitizeBody(once)).toBe(once);
    }
  });
});

describe("Scalable amounts in the editor", () => {
  const MARKED = [
    "<p>Beat <amount>2</amount> eggs, then <amount>1 1/2 cups</amount> milk. Bake 20 minutes.</p>",
    "Plain text with <amount>2-3</amount> cloves\n\nand a second paragraph",
  ];

  for (const body of MARKED) {
    it(`shows ${JSON.stringify(body.slice(0, 30))} with its <amount> tags, without writing it back`, () => {
      const writes = [];
      const el = show(body, (html) => writes.push(html));
      el.dispatchEvent(new FocusEvent("focus"));
      el.dispatchEvent(new FocusEvent("blur"));
      expect(el.innerHTML).toBe(bodyHtml(body));
      expect(el.querySelectorAll("amount").length).toBeGreaterThan(0);
      expect(writes).toEqual([]);
    });
  }

  it("an untouched recipe with marked amounts saves back byte-identical", async () => {
    const recipe = { id: 2, text: MARKED.map((body, i) => ({ header: `H${i}`, body })) };
    let sent = null;
    const edit = new RecipeEdit(recipe, { data: { async updateRecipe(r) { sent = JSON.stringify(r); return r; } } });
    for (const block of recipe.text) show(block.body);
    expect(edit.dirty).toBe(false);
    await edit.save();
    expect(sent).toBe(JSON.stringify(recipe));
  });

  it("keeps <amount> when the user edits around it", () => {
    const writes = [];
    const el = show(MARKED[0], (html) => writes.push(html));
    el.querySelector("p").append(" Serve.");
    el.dispatchEvent(new Event("input", { bubbles: true }));
    expect(writes[0]).toContain("<amount>2</amount>");
    expect(writes[0]).toContain("<amount>1 1/2 cups</amount>");
  });
});
