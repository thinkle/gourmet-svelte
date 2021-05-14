// Mocks...
import "mock-local-storage";
import jestFetchMocks from "jest-fetch-mock";
jestFetchMocks.enableMocks();
import indexedDB from "fake-indexeddb";
import IDBKeyRange from "fake-indexeddb/lib/FDBKeyRange";

import { testRecs } from "../common/mocks/recipes";
import mockUser from "../common/mocks/user";
import { mockLambdaFunction } from "../data/functions/mockFunction";
import {
  setupEmptyDB,
  setupDBwithRecs,
} from "../data/functions/setupMockDB.js";
import deepcopy from "deepcopy";
import { jsonConcisify } from "../utils/textUtils";
import { user } from "./userStore";
import {
  connected,
  localRecipes,
  openLocalRecipes,
  storedRecipes,
  recipePage,
  recipeActions,
  recipeState,
  recipeActionState,
  recipeActionGeneralState,
} from "./recipeStores.js";

import { tick } from "svelte";
import { get } from "svelte/store";

beforeAll(async () => {
  mockLambdaFunction(user);
  user.fake(mockUser);
});

it("Connection to mocks works :)", async () => {
  // first subscriber triggers connection
  get(connected);
  // wait one tick for the connection to happen
  await tick();
  // expect it to happen
  expect(get(connected)).toBe(true);
});

describe("Starting with an empty database", () => {
  beforeAll(async () => {
    get(connected);
    await tick();
    await setupEmptyDB(user);
  });

  it("Create a new recipe!", async () => {
    await recipeActions.createRecipe(testRecs.standard);
    await tick();
    let id = get(recipeActionGeneralState).created;
    expect(id).toBeDefined();
    await tick();
    let loc = get(localRecipes)[id];
    let stored = get(storedRecipes)[id];
    expect(loc).toBeDefined();
    expect(stored).toBeDefined();
    expect(loc.title).toEqual(stored.title);
    expect(loc.title).toEqual(testRecs.standard.title);
  });
});

describe("Starting with data in the database", () => {
  beforeAll(async () => {
    console.log("BEFORE_ALL Connect");
    get(connected);
    await tick();
    await setupDBwithRecs(user);
    await recipeActions.doSync(true); // test mode -- just a few
    await tick();
  });

  it("Syncing grabs new recipes", async () => {
    let current = get(storedRecipes);
    expect(current).toBeDefined();
    expect(Object.keys(current).length).toBeGreaterThan(10);
  });

  it("Syncing AGAIN grabs new recipes", async () => {
    let current = get(storedRecipes);
    expect(current).toBeDefined();
    expect(Object.keys(current).length).toBeGreaterThan(10);
  });

  it("Opening and editing recipe updates state correctly", async () => {
    let current = get(storedRecipes);
    expect(current).toBeDefined();
    expect(Object.keys(current).length).toBeGreaterThan(5);
    await tick();
    let page = get(recipePage);
    await tick();
    expect(page).toBeDefined();
    expect(page.length).toBeGreaterThan(5);
    let recs = get(storedRecipes);
    let id1 = page[0];
    let id2 = page[1];
    expect(id1).toBeDefined();
    expect(id2).toBeDefined();
    let openRec = await localRecipes.open(id1);
    let openRec2 = await localRecipes.open(id2);
    let localRecs = get(localRecipes);
    expect(localRecs).toBeDefined();
    let localCopy = localRecs[id1];
    localCopy.title += "Foo"; // change the title
    // We have made a change to the object...
    localRecipes.update(($localRecipes) => $localRecipes);
    let recState = get(recipeState);
    expect(recState[id1].edited).toBeTruthy();
    expect(recState[id2].edited).toBeFalsy();
  });
});
