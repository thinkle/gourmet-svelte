import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { user } from "../stores/userStore.js";
import recipeData from "../data/recipeData.js";
import localRecipeData from "../data/local/dexieApi.js";
import { signIn } from "../auth/session.js";
import { library, reload } from "./library.svelte.js";

vi.mock("../stores/userStore.js", async () => {
  const { writable } = await import("svelte/store");
  return { user: { ...writable(null), retrySignIn: vi.fn() } };
});
vi.mock("../auth/session.js", () => ({ signIn: vi.fn() }));
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
  user.set({ email: "test@example.invalid", access_token: "synthetic-token", expires_at: Date.now() + 3600000, remoteUser: { dbUser: {} } });
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

  it("offers sign-in without syncing when signed out", async () => {
    expect(library.account).toBe("test@example.invalid");
    user.set(null);
    await reload();
    expect(library.account).toBe(null);
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(library.error).toBe(null);
    expect(recipeData.sync).toHaveBeenCalledTimes(1);
  });
  it("lets the request layer refresh credentials when syncing", async () => {
    user.set({ email: "test@example.invalid", remoteUser: { dbUser: {} } });
    await reload();
    expect(signIn).not.toHaveBeenCalled();
    expect(recipeData.sync).toHaveBeenCalledTimes(2);
    expect(library.needsSignIn).toBe(false);
  });

  it("offers a retry if initial profile hydration fails", async () => {
    user.set(null);
    user.set({ email: "test@example.invalid", signInError: "Offline" });
    expect(library.status).toBe("error");
    expect(library.error).toBe("Offline");
    await reload();
    expect(user.retrySignIn).toHaveBeenCalledTimes(1);
    expect(signIn).not.toHaveBeenCalled();
  });

  it.each([{ error: "Not signed in" }, { error: "Unauthorized" }, { status: 401 }])("offers sign-in on server auth rejection %j", async (error) => {
    recipeData.sync.mockRejectedValueOnce(error);
    await reload();
    expect(signIn).toHaveBeenCalledTimes(1);
    expect(library.needsSignIn).toBe(true);
    expect(library.error).toBe(null);
    expect(library.status).toBe("ready");
    expect(library.recipes[0].title).toBe("Soup");
    expect(library.syncing).toBe(false);
    // Signing in hydrates the user again and retries the normal account load.
    user.set({ email: "test@example.invalid", access_token: "fresh-synthetic-token" });
    user.set({ email: "test@example.invalid", access_token: "fresh-synthetic-token", remoteUser: { dbUser: {} } });
    await vi.waitFor(() => expect(library.syncing).toBe(false));
    expect(library.needsSignIn).toBe(false);
    expect(library.status).toBe("ready");
  });

  it("does not restore an error or recipes when an old request rejects after logout", async () => {
    const pending = deferred();
    recipeData.sync.mockReturnValueOnce(pending.promise);
    const syncing = reload();
    await vi.waitFor(() => expect(recipeData.sync).toHaveBeenCalledTimes(2));
    user.set(null);
    pending.reject({ error: "Not signed in" });
    await syncing;
    expect(library.status).toBe("signed-out");
    expect(library.error).toBe(null);
    expect(library.recipes).toEqual([]);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("offers a sign-in action on startup auth rejection without opening a modal", async () => {
    user.set(null);
    recipeData.sync.mockRejectedValueOnce({ error: "Not signed in" });
    user.set({ email: "test@example.invalid", access_token: "synthetic-token", remoteUser: { dbUser: {} } });
    await vi.waitFor(() => expect(library.needsSignIn).toBe(true));
    expect(library.error).toBe(null);
    expect(library.status).toBe("ready");
    expect(signIn).not.toHaveBeenCalled();
  });

});
