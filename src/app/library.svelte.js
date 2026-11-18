// The signed-in person's recipes, as the screens want them.
//
// Recipes live in the kept local cache (Dexie) and are kept in step with the
// server by the kept sync code. This module shows what the cache has at once,
// starts a sync, and refreshes as recipes arrive.
import Dexie from "dexie";
import { get } from "svelte/store";
import { user } from "../stores/userStore.js";
import recipeData, { connectedRemote } from "../data/recipeData.js";
import localRecipeData from "../data/local/dexieApi.js";
import { prepare, isRecipe } from "./lib.js";

export const library = $state({
  /** "signed-out" | "signing-in" | "loading" | "ready" | "error" */
  status: "signed-out",
  recipes: [],
  syncing: false,
  error: null,
  who: null,
});

let running = null; // the account a load is in flight or done for
let fixturesMode = false;

// The stored rows as read, by local id: the editor edits these, not the
// screens' prepared copies.
const rows = new Map();
function show(list) {
  rows.clear();
  for (const r of list) rows.set(r.id, r);
  library.recipes = list.filter(isRecipe).map(prepare);
}

/** The stored record for a local id, as it was read (do not mutate). */
export const storedRecipe = (id) => rows.get(id);

/** After a save or delete: show the stored record without re-reading everything. */
export function putRecipe(row) {
  rows.set(row.id, row);
  const i = library.recipes.findIndex((r) => r.id === row.id);
  if (!isRecipe(row)) { if (i >= 0) library.recipes.splice(i, 1); }
  else if (i >= 0) library.recipes[i] = prepare(row);
  else library.recipes.unshift(prepare(row));
}

async function readCache() {
  if (!localRecipeData.db) await localRecipeData.connect();
  show(await localRecipeData.db.recipes.toArray());
}

// Saves made in fixtures mode go to this browser's local cache, where the
// kept sync would upload them at the next sign-in. They must never reach the
// server: if this origin later signs in, that cache is thrown away first.
const FIXTURE_WRITES = "gourmet.fixtureWrites";
function storage(fn) { try { return fn(globalThis.localStorage); } catch { return null; } }
async function dropFixtureWrites() {
  if (!storage((s) => s.getItem(FIXTURE_WRITES))) return;
  localRecipeData.db?.close();
  localRecipeData.db = null;
  await Dexie.delete("Recipes");
  storage((s) => s.removeItem(FIXTURE_WRITES));
}

async function guard() {
  if (!localRecipeData.db) await localRecipeData.connect();
  if (!fixturesMode) return;
  if (get(user) || get(connectedRemote)) throw new Error("Fixtures mode does not save while signed in.");
  storage((s) => s.setItem(FIXTURE_WRITES, "1"));
}

/**
   The data layer the editor saves through: Gourmet's kept recipeData. In
   fixtures mode it refuses to run with anyone signed in, so a save there can
   only reach the local cache.
*/
export const editorData = {
  async updateRecipe(recipe, stamp) {
    await guard();
    return recipeData.updateRecipe(recipe, stamp);
  },
  async addRecipe(recipe) {
    await guard();
    return recipeData.addRecipe(recipe);
  },
};

async function load(account) {
  running = account;
  library.error = null;
  try {
    await dropFixtureWrites();
    await readCache();
    library.status = library.recipes.length ? "ready" : "loading";
    library.syncing = true;
    let pending = false;
    await recipeData.sync(false, {
      // Recipes arrive in batches; show them without re-reading on every one.
      onPartialSync: () => {
        if (pending) return;
        pending = true;
        setTimeout(async () => { pending = false; if (running === account) await readCache(); }, 400);
      },
    });
    if (running !== account) return;
    await readCache();
    library.status = "ready";
  } catch (err) {
    console.error("Could not load recipes", err);
    library.error = String(err?.error ?? err?.message ?? err);
    // What the cache already had is still worth showing.
    library.status = library.recipes.length ? "ready" : "error";
  } finally {
    if (running === account) library.syncing = false;
  }
}

export const reload = () => { if (running) return load(running); };

user.subscribe((u) => {
  // Fixtures mode never loads an account (and never syncs).
  if (fixturesMode) return;
  if (!u) {
    running = null;
    rows.clear();
    Object.assign(library, { status: "signed-out", recipes: [], syncing: false, error: null, who: null });
    return;
  }
  library.who = u.remoteUser?.dbUser?.name || u.username || u.email;
  const account = u.remoteUser?.dbUser && (u.remoteUser.account || u.email);
  if (!account) { if (library.status === "signed-out") library.status = "signing-in"; return; }
  if (running !== account) load(account);
});

// Design work without signing in: `npm run dev`, then open /?fixtures with a
// local, uncommitted src/app/fixtures.local.json (an array of stored recipes).
const fixtures = import.meta.glob("./fixtures.local.json");
export async function loadFixtures() {
  const file = fixtures["./fixtures.local.json"];
  if (!import.meta.env.DEV || !file) return false;
  fixturesMode = true;
  show((await file()).default);
  Object.assign(library, { status: "ready", who: "Fixtures" });
  return true;
}
