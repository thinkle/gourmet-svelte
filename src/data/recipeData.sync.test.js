// Sync must never let a server recipe choose its own slot in the local cache.
import Dexie from "dexie";
import indexedDB from "fake-indexeddb";
import IDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";
import { testRecs } from "../common/mocks/recipes.js";

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange;

let mockServer = [];

jest.mock("../stores/userStore.js", () => ({
  user: {
    subscribe(fn) {
      fn({ remoteUser: { dbUser: {} } });
      return () => {};
    },
  },
}));

jest.mock("./remoteRecipeData.js", () => ({
  RecipeData: () => ({
    async getRecipes({ query } = {}) {
      let result = mockServer;
      if (query && query._id && query._id.$in) {
        result = mockServer.filter((r) => query._id.$in.includes(r._id));
      }
      // return copies, as a real HTTP response would
      result = JSON.parse(JSON.stringify(result));
      return { result, count: result.length, page: result.length };
    },
  }),
}));

import recipeData from "./recipeData.js";
import localRecipeData from "./local/dexieApi.js";

function serverRec(_id, title, id) {
  let rec = JSON.parse(JSON.stringify(testRecs.standard));
  delete rec.id;
  delete rec.localid;
  rec._id = _id;
  rec.title = title;
  rec.last_modified = 1000;
  if (id !== undefined) {
    rec.id = id;
  }
  return rec;
}

async function allLocal() {
  return (await localRecipeData.getRecipes()).result;
}

it("syncs every server recipe into an empty cache, whatever `id` they carry", async () => {
  await localRecipeData.connect();
  await localRecipeData.db.recipes.clear();
  // Newest first, as the server sends them
  mockServer = [
    serverRec("m1", "new 1"),
    serverRec("m2", "new 2"),
    serverRec("m3", "new 3"),
    serverRec("m4", "old 1", 1),
    serverRec("m5", "old 2", 2),
    serverRec("m6", "old 3", 3),
    serverRec("m7", "shared id A", 7),
    serverRec("m8", "shared id B", 7),
  ];
  await recipeData.sync(false, {});
  let local = await allLocal();
  expect(local.length).toBe(mockServer.length);
  for (let s of mockServer) {
    let found = await localRecipeData.getRecipe(undefined, { mongoId: s._id });
    expect(found).toBeDefined();
    expect(found.title).toBe(s.title);
  }
  expect(new Set(local.map((r) => r.id)).size).toBe(local.length);
});

it("a second sync updates a changed recipe in place", async () => {
  let before = await allLocal();
  let beforeIds = {};
  before.forEach((r) => (beforeIds[r._id] = r.id));
  mockServer = mockServer.map((r) =>
    r._id === "m4" ? { ...r, title: "old 1 EDITED", last_modified: 2000 } : r
  );
  await recipeData.sync(false, {});
  let after = await allLocal();
  expect(after.length).toBe(before.length);
  let edited = await localRecipeData.getRecipe(undefined, { mongoId: "m4" });
  expect(edited.title).toBe("old 1 EDITED");
  expect(edited.id).toBe(beforeIds["m4"]);
  after.forEach((r) => expect(r.id).toBe(beforeIds[r._id]));
});
