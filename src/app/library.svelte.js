// The signed-in person's recipes, as the screens want them.
//
// Recipes live in the kept local cache (Dexie) and are kept in step with the
// server by the kept sync code. This module shows what the cache has at once,
// starts a sync, and refreshes as recipes arrive.
import { user } from "../stores/userStore.js";
import recipeData from "../data/recipeData.js";
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

async function readCache() {
  if (!localRecipeData.db) await localRecipeData.connect();
  const rows = await localRecipeData.db.recipes.toArray();
  library.recipes = rows.filter(isRecipe).map(prepare);
}

async function load(account) {
  running = account;
  library.error = null;
  try {
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
  if (!u) {
    running = null;
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
  const rows = (await file()).default;
  Object.assign(library, { status: "ready", recipes: rows.filter(isRecipe).map(prepare), who: "Fixtures" });
  return true;
}
