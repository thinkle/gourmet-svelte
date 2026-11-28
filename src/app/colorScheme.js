/* Which scheme the app wears.
 *
 * "auto" is the browser's own preference and the default; "light" and
 * "dark" pin one. The whole of the switch is an attribute on <html>, read
 * by src/theme/scheme.css -- no component has to know. The choice is kept
 * per device in localStorage, which is also where a Settings screen's
 * typography and print preferences will belong.
 */
const KEY = "gourmet.colorScheme";

/** The choices, in the order a chooser should offer them. */
export const COLOR_SCHEMES = ["auto", "light", "dark"];

const clean = (s) => (COLOR_SCHEMES.includes(s) ? s : "auto");

/** What was chosen on this device, or "auto" if nothing was. */
export function storedColorScheme() {
  try {
    return clean(localStorage.getItem(KEY));
  } catch {
    // Private browsing, or storage the browser refuses: follow the browser.
    return "auto";
  }
}

/** Put a scheme on the document without remembering it. */
export function applyColorScheme(scheme, root = document.documentElement) {
  const s = clean(scheme);
  if (s === "auto") delete root.dataset.colorScheme;
  else root.dataset.colorScheme = s;
  return s;
}

/** Choose a scheme: on the document now, and on this device from now on. */
export function setColorScheme(scheme) {
  const s = applyColorScheme(scheme);
  try {
    localStorage.setItem(KEY, s);
  } catch {
    // Nothing to do: the document still changed, it just will not be kept.
  }
  return s;
}

/** On load, before the app mounts: wear what was chosen. */
export const initColorScheme = () => applyColorScheme(storedColorScheme());
