import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  COLOR_SCHEMES,
  applyColorScheme,
  initColorScheme,
  setColorScheme,
  storedColorScheme,
} from "./colorScheme.js";

const root = () => document.documentElement;

beforeEach(() => {
  localStorage.clear();
  delete root().dataset.colorScheme;
});

describe("the colour scheme", () => {
  it("follows the browser until something is chosen", () => {
    expect(storedColorScheme()).toBe("auto");
    initColorScheme();
    expect(root().dataset.colorScheme).toBe(undefined);
  });

  it("pins the scheme on the document and remembers it", () => {
    expect(setColorScheme("dark")).toBe("dark");
    expect(root().dataset.colorScheme).toBe("dark");
    expect(storedColorScheme()).toBe("dark");
    // A new load wears it again.
    delete root().dataset.colorScheme;
    initColorScheme();
    expect(root().dataset.colorScheme).toBe("dark");
  });

  it("takes the attribute back off for auto", () => {
    setColorScheme("light");
    expect(root().dataset.colorScheme).toBe("light");
    setColorScheme("auto");
    expect(root().dataset.colorScheme).toBe(undefined);
    expect(storedColorScheme()).toBe("auto");
  });

  it("ignores anything that is not a scheme, stored or passed", () => {
    expect(applyColorScheme("chartreuse")).toBe("auto");
    localStorage.setItem("gourmet.colorScheme", "chartreuse");
    expect(storedColorScheme()).toBe("auto");
    expect(COLOR_SCHEMES).toEqual(["auto", "light", "dark"]);
  });

  it("still changes the document when storage is refused", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const getItem = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(setColorScheme("dark")).toBe("dark");
    expect(root().dataset.colorScheme).toBe("dark");
    expect(storedColorScheme()).toBe("auto");
    setItem.mockRestore();
    getItem.mockRestore();
  });
});
