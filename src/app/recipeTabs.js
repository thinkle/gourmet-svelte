// URLs use server IDs so bookmarks survive a fresh cache or another browser.
// A recipe saved only on this device can still survive a refresh here.
const refFor = (r) => r._id ? String(r._id) : `local:${r.id}`;

export function hasRecipeTabs(hash) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.has("recipes") || params.has("tab");
}

// sessionStorage belongs to one browser tab. A duplicated tab starts with a
// copy, then the two diverge; other windows never overwrite this tab's choices.
const sessionKey = (account) => `gourmet.openRecipes:${account}`;
export function loadTabSession(account, storage) {
  try { return (storage ?? globalThis.sessionStorage).getItem(sessionKey(account)) ?? ""; }
  catch { return ""; } // storage can be unavailable in private/restricted browsers
}
export function saveTabSession(account, hash, storage) {
  try { (storage ?? globalThis.sessionStorage).setItem(sessionKey(account), hash); }
  catch { /* Recipe navigation still works when browser storage is unavailable. */ }
}

export function bookmarkHash(hash, ids, tab, recipes) {
  const result = writeRecipeTabs(hash, ids, tab, recipes);
  if (hasRecipeTabs(result)) return result;
  // An explicitly empty workspace must override a tab's remembered recipes.
  const params = new URLSearchParams(result.replace(/^#/, ""));
  params.set("tab", "search");
  return `#${params}`;
}

export function readRecipeTabs(hash, recipes) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const find = (ref) => recipes.find((r) => refFor(r) === ref
    || (!ref.includes(":") && String(r.id) === ref && /^\d+$/.test(ref)));
  const ids = [...new Set((params.get("recipes") ?? "").split(",")
    .map((ref) => find(ref)?.id).filter((id) => id != null))];
  const active = params.get("tab");
  const id = find(active ?? "")?.id;
  return { ids, tab: active === "shopping" ? "shopping" : ids.includes(id) ? id : "search" };
}

export function writeRecipeTabs(hash, ids, tab, recipes) {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const refs = ids.filter((id) => byId.has(id)).map((id) => refFor(byId.get(id)));
  if (refs.length) params.set("recipes", refs.join(","));
  else params.delete("recipes");
  const active = ids.includes(tab) && byId.get(tab);
  if (tab === "shopping") params.set("tab", "shopping");
  else if (active) params.set("tab", refFor(active));
  else params.delete("tab");
  return params.size ? `#${params}` : "";
}

/**
   Where a newly opened recipe goes: immediately right of the tab it was
   opened from, so a linked sub-recipe lands next to the recipe that
   referred to it rather than at the far end of the strip. Opened from
   search or the shopping list (no recipe tab to sit beside), it goes last.
**/
export function insertBeside(ids, id, from) {
  if (ids.includes(id)) return [...ids];
  const at = ids.indexOf(from);
  return at < 0 ? [...ids, id] : [...ids.slice(0, at + 1), id, ...ids.slice(at + 1)];
}
