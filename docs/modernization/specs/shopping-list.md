# Shopping list: behaviour spec

Written from `legacy/src/stores/shoppingStores.js` (and its test),
`legacy/src/shopDisplay/*` and the shopping parts of `legacy/src/recDisplay/rec/Recipe.svelte`.
Status: first version built (slice S). The owner moved the list back into scope.

## Stored data

A shopping list is an ordinary stored recipe document with `isShoppingList` set
(the old app writes `1`). It is saved, cached in Dexie and synced exactly like a
recipe. The recipe list hides it (`isRecipe` in `src/app/lib.js`).

Its `ingredients` array holds two kinds of entry:

```json
{
  "title": "Shopping List",
  "isShoppingList": 1,
  "deleted": 0,
  "ingredients": [
    { "id": 3, "text": "Recipe title", "amount": { "amount": 2, "unit": "recipe" },
      "reference": "<recipe _id, or local id before first sync>", "referenceExists": true },
    { "id": 4, "text": "onions", "originalText": "2 lb onions",
      "amount": { "amount": 2, "unit": "lb" } }
  ],
  "checked": ["flour", "onions"]
}
```

- Recipe reference: `reference` points at a recipe (`_id` when it has one, else
  the local id; the kept save path swaps local ids for `_id`s, see
  `checkForReferences`). `amount.amount` is the multiplier, `unit` is `"recipe"`,
  `text` is a copy of the title (so the list still reads if the recipe is gone).
- Loose item: any entry with no `reference`. Same shape as a recipe ingredient
  (`text`, optional `amount`), made with `parseIngredientText` so "2 lb
  onions" works. Gets a small numeric `id` unique within the list.
- `checked` (new, optional, top-level): list of item keys (lowercase shop-item
  name, see below) the shopper has ticked. Absent means nothing ticked.

Observed in the real data (a fixtures dump): there can be several shopping-list
documents (empty local ones plus one with recipe references). The old app took
whichever the query returned first. New rule: ignore deleted ones, prefer the
one with the most entries, then the newest `last_modified`. If none exists the
first add creates one. (Open question for the owner: clean up the spares.)

## Adding recipes and multipliers

- Recipe view "Add to shopping list" adds the recipe at the view's current
  multiplier (`mult`). If the recipe is already on the list the multipliers add
  (old behaviour: 1 + 2 = 3). The list screen lets you edit the multiplier
  directly, so this is easy to correct.
- A recipe on the list can be removed (its items go with it). Items are never
  copied out of the recipe: the list stores only the reference and multiplier,
  and the items are worked out from the recipe as it is now.
- Nested references (a recipe whose ingredient is another recipe) are followed;
  the nested amount multiplies. A cycle, or a reference to a recipe the cache
  does not have, is skipped (a missing one is shown on the list as "not found").

## How amounts merge and group

1. Walk every reference: flatten ingredient groups, multiply each amount (and
   range) by the list multiplier (times any nested multiplier).
2. Item key: `getShopItem(ingredient)` (`src/utils/ingredientUtils.js`: the
   ingredient's own `shopItem` if set, else the meaningful words, title-cased).
   It is given the text without parenthetical asides, text after a comma or
   " -- ", and bare numbers, because the extractor otherwise keeps those words.
   "Unsalted butter" and "butter, softened" thus both reach "Butter" when the
   extractor agrees; it is the old grouping, unchanged.
3. Per key, `addAmounts` (`src/utils/unitAmounts.js`) adds amounts that share a
   unit or convert (cups + tbsp -> cups), and keeps different units as separate
   lines ("2 cups + 1 can"). Ranges add their upper bound (shopping: round up).
   Ingredients with no amount contribute no amount (old code counted them as 1;
   that turned "salt" into "1").
4. Display amounts with `formatAmount` from `src/utils/numbers.js`.
5. Each merged item remembers where it came from: recipe title (with its
   multiplier) and the original ingredient text.

Grouping on screen: "To buy" (unticked, A-Z) then "Got it" (ticked, A-Z, below).
The old app had no aisles or categories; it sorted A-Z. Aisle grouping is deferred.

## Checked

Old app: the checkbox did nothing (it logged to the console). "Ignore" ("I
already have this") was stored as `shopIgnore` on the source recipe's own
ingredient, i.e. it edited the recipe. We do not do that.

New: ticking stores the item key in the list document's `checked` array, so it
syncs and survives reload. A key that no longer matches any item is dropped the
next time the list is saved. "Clear ticked" empties the array; removing a recipe
leaves ticks alone. Checked keys are per item name, not per recipe line.

## What syncs

Everything above is one document, so it syncs as one document through the kept
save path (`recipeData.addRecipe` / `updateRecipe`, local Dexie row first, then
remote, `savedRemote: 0` retried by the kept sync). Each change re-reads the
local row, edits it and saves, so edits made on another device that have already
synced are not overwritten from stale memory. Known limit: the server's merge
path keeps ingredients it already has by `text`, so a removal made while the
local copy is stale can come back after a sync. This is the kept server logic,
not changed here.

Fixtures mode (and any session with no signed-in database user) saves to the
local Dexie row only, never the glue layer, so the server cannot be reached.

Stored-shape note (AGENTS rule 2): `checked` is a new field on shopping-list
documents only. Take a dump (`scripts/migrate/dump.mjs`) before the first real
save of a list from this build.

## Old features: keep, drop, defer

| Old feature | Decision |
| --- | --- |
| Add recipe at multiplier; sums if repeated | keep |
| Edit multiplier on the list; remove recipe | keep |
| Merge identical items, add compatible units | keep (kept `addAmounts`) |
| Add a loose item (free text, parsed) | keep |
| Show which recipes an item comes from | keep (compact line under the item) |
| Check off | keep (made real; stored) |
| Remove a loose item | keep |
| Clear list | keep as "Clear ticked" only; clearing everything is remove-per-recipe |
| Rename an item (`shopItem`) / "Separate" an ingredient from a merge | defer |
| "Ignore" (already have it) | defer (replaced by checking off) |
| Recipe picker dialog on the list screen | drop; add from the recipe view |
| Add from the recipe list (bulk) | defer |
| Aisles / categories | defer |
| Family sharing of one list | defer (needs the linked-accounts model) |

## What an MCP agent would need (note only, API unchanged)

The shopping list is a recipe document, so the existing `/recipes/*` routes
already reach it by `_id`, but `isShoppingList` documents are not discoverable
or documented, and an agent would have to know the reference-with-multiplier
convention. Needed, additively, later:

- Find the list: a search filter or a `GET /recipes/shopping-list` returning the
  document (creating it if absent).
- Add a recipe by `_id` and multiplier, add a loose item (plain string, parsed
  as for recipes), tick/untick by name: small POST/PATCH calls that append
  rather than replace `ingredients` (a PUT replaces the list and loses ticks).
- Read the merged list (item, amounts, from which recipes, ticked), so the agent
  does not reimplement merging. Today that logic lives only in the client.
- Document `checked`, `reference` and `amount.unit: "recipe"` in
  `public/openapi.yaml`.
