import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import { user } from "../stores/userStore.js";
import { getUserRequest } from "../data/requests/index.js";

const dbUser = { email: "cook@example.invalid", name: "Cook" };
const profileResponse = () => Response.json({ email: dbUser.email, dbUser });
const unauthorized = () => new Response("Unauthorized", { status: 401 });
const identity = (jwt) => ({ email: dbUser.email, jwt, clearSession: vi.fn() });
let fetcher;

beforeEach(() => {
  fetcher = vi.fn().mockImplementation(profileResponse);
  vi.stubGlobal("fetch", fetcher);
});
afterEach(() => {
  user.logout();
  vi.unstubAllGlobals();
});

describe("Identity session requests", () => {
  it("hydrates via Identity once and gets the current JWT for later requests", async () => {
    const jwt = vi.fn().mockResolvedValueOnce("initial").mockResolvedValue("refreshed");
    const current = identity(jwt);
    await Promise.all([user.login(current), user.login(current)]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(get(user)).toMatchObject({ email: dbUser.email, remoteUser: { dbUser } });
    expect(get(user)).not.toHaveProperty("access_token");
    await getUserRequest.makeRequest({ user: get(user) });
    expect(fetcher.mock.calls.map(([, options]) => options.headers.Authorization))
      .toEqual(["Bearer initial", "Bearer refreshed"]);
  });

  it("shares one forced refresh across concurrent 401s and retries each request once", async () => {
    const jwt = vi.fn((force) => Promise.resolve(force ? "fresh" : "old"));
    const current = identity(jwt);
    await user.login(current);
    fetcher.mockImplementation((_url, { headers }) =>
      headers.Authorization === "Bearer old" ? unauthorized() : profileResponse());
    const profile = get(user);
    await Promise.all([
      getUserRequest.makeRequest({ user: profile }),
      getUserRequest.makeRequest({ user: profile }),
    ]);
    expect(jwt.mock.calls.filter(([force]) => force)).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(get(user)).toBe(profile);
  });

  it("signs out after a second 401 without a third attempt", async () => {
    const current = identity(vi.fn().mockResolvedValue("rejected"));
    fetcher.mockImplementation(unauthorized);
    await user.login(current);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(current.clearSession).toHaveBeenCalledTimes(1);
    expect(get(user)).toBeNull();
  });

  it("signs out on failed refresh without sending a stale token", async () => {
    const current = identity(vi.fn().mockRejectedValue(new Error("Expired")));
    await user.login(current);
    expect(fetcher).not.toHaveBeenCalled();
    expect(get(user)).toBeNull();
  });

  it("keeps profile hydration retryable if the API is offline", async () => {
    const current = identity(vi.fn().mockResolvedValue("valid"));
    fetcher.mockRejectedValueOnce(new TypeError("Offline"));
    await user.login(current);
    expect(get(user)).toMatchObject({ signInError: "Offline" });
    expect(current.clearSession).not.toHaveBeenCalled();
    await user.retrySignIn();
    expect(get(user)).toMatchObject({ signInError: null, remoteUser: { dbUser } });
  });

  it("does not let a delayed request clear or overwrite a newer sign-in", async () => {
    let finish;
    fetcher.mockReturnValueOnce(new Promise((resolve) => { finish = resolve; }));
    const previous = identity(vi.fn().mockResolvedValue("old"));
    const oldLogin = user.login(previous);
    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
    user.logout();
    await user.login(identity(vi.fn().mockResolvedValue("new")));
    const newest = get(user);
    finish(unauthorized());
    await oldLogin;
    expect(get(user)).toBe(newest);
    expect(previous.clearSession).not.toHaveBeenCalled();
  });
});
