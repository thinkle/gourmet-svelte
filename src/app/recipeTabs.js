// URLs use server IDs so bookmarks survive a fresh cache or another browser.
// A recipe saved only on this device can still survive a refresh here.
const refFor = (r) => r._id ? String(r._id) : `local:${r.id}`;

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
