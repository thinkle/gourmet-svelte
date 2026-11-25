import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { user } from "../stores/userStore.js";
import recipeData from "../data/recipeData.js";
import localRecipeData from "../data/local/dexieApi.js";
import { library, reload } from "./library.svelte.js";

vi.mock("../stores/userStore.js", async () => {
  const { writable } = await import("svelte/store");
  return { user: writable(null) };
});
vi.mock("../data/recipeData.js", () => ({ default: { sync: vi.fn() }, connectedRemote: {} }));
vi.mock("../data/local/dexieApi.js", () => ({ default: { db: { recipes: { toArray: vi.fn() } } } }));

const cached = [{ id: 244, _id: "one", title: "Soup" }];
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };

beforeEach(async () => {
  vi.clearAllMocks();
  localStorage.clear();
  user.set(null);
  localRecipeData.db.recipes.toArray.mockResolvedValue(cached);
  recipeData.sync.mockResolvedValue({});
  user.set({ email: "test@example.invalid", remoteUser: { dbUser: {} } });
  await vi.waitFor(() => expect(library.status).toBe("ready"));
});
afterEach(() => { user.set(null); vi.restoreAllMocks(); });

describe("in-app cloud sync", () => {
  it("shows arrivals without leaving ready state and prevents overlapping reloads", async () => {
    const sync = deferred();
    recipeData.sync.mockReturnValueOnce(sync.promise);
    const pending = reload();
    expect(library.syncing).toBe(true);
    expect(library.status).toBe("ready");
    reload();
    await vi.waitFor(() => expect(recipeData.sync).toHaveBeenCalledTimes(2));
    localRecipeData.db.recipes.toArray.mockResolvedValue([...cached, { id: 246, title: "MCP arrival" }]);
    sync.resolve({});
    await pending;
    expect(library.recipes.map((r) => r.title)).toEqual(["Soup", "MCP arrival"]);
    expect(library.syncing).toBe(false);
    expect(library.status).toBe("ready");
  });

  it("keeps cached recipes on failure, reports the error, and allows retry", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    recipeData.sync.mockRejectedValueOnce(new Error("Offline"));
    await reload();
    expect(library.status).toBe("ready");
    expect(library.recipes[0].title).toBe("Soup");
    expect(library.error).toBe("Offline");
    expect(library.syncing).toBe(false);
    await reload();
    expect(library.error).toBe(null);
    expect(library.status).toBe("ready");
  });

  it("does not sync when signed out", async () => {
    user.set(null);
    await reload();
    expect(recipeData.sync).toHaveBeenCalledTimes(1);
  });
});
