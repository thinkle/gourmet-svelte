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
  "cart": ["eggs"],
  "alreadyHave": ["flour"],
  "aisles": { "eggs": "Dairy & eggs" },
  "aisleOrder": ["Produce", "Dairy & eggs"]
}
```

- Recipe reference: `reference` points at a recipe (`_id` when it has one, else
  the local id; the kept save path swaps local ids for `_id`s, see
  `checkForReferences`). `amount.amount` is the multiplier, `unit` is `"recipe"`,
  `text` is a copy of the title (so the list still reads if the recipe is gone).
- Loose item: any entry with no `reference`. Same shape as a recipe ingredient
  (`text`, optional `amount`), made with `parseIngredientText` so "2 lb
  onions" works. Gets a small numeric `id` unique within the list.
- New optional top-level fields, all item-key based (see "Structure"): `cart`,
  `alreadyHave`, `alreadyHaveOff`, `trip`, `aisles`, `aisleOrder`, `keyAliases`.
  They are named `aisles`/`aisleOrder`, not `categories`, because `categories`
  is a recipe field the local save code (`prepRecLocal`) reads as a list.

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

Grouping on screen: see "Structure" below (To buy by aisle, In the cart,
Already have). The old web app had no aisles; it sorted A to Z.

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

Stored-shape note (AGENTS rule 2): `cart`, `alreadyHave`, `alreadyHaveOff`, `trip`, `aisles`, `aisleOrder` and
`keyAliases` are new fields on shopping-list documents only. Take a dump (`scripts/migrate/dump.mjs`) before the first real
save of a list from this build.

## Structure (after desktop Gourmet)

### What the desktop app did (read from `/Users/thinkle/Projects/from-pebble/Projects/gourmet/gourmet/`)

- `shopping.py` `Shopper`: every ingredient is reduced to `[amount, unit, key]`
  (`ingkey`). Amounts for one key are combined (`combine_ingredient`, with unit
  conversion and ranges). Keys in `self.pantry` go to a second dictionary
  (`mypantry`); everything else is the shopping list. `default_pantry`
  (flour all purpose, sugar, salt, black pepper ground, ice, water, oil
  vegetable, oil olive) seeds the pantry. `organize()` groups by category
  (`orgdic`: key -> category, default from the language tables, else
  "Unknown"), categories sorted by `catorder_dic` (known positions) else A to Z,
  empty/unknown last (`_cat_compare`), items A to Z.
- `shopgui.py`: two panes, "Shopping List" and "Already Have (Pantry Items)";
  actions "Move to pantry" / "Move to shopping list" (`add_selection_to_pantry`,
  `rem_selection_from_pantry`), "Change Category" (pick an existing category,
  "Create new category", or drag onto a category; dragging a category header
  re-orders categories and saves `commit_category_orders`), add arbitrary items,
  and a prompt about optional ingredients (`getOptionalDic`, `shop_handle_optional`).
- `backends/db.py`: `shopcats` (ingkey, shopcategory, position),
  `shopcatsorder` (shopcategory, position), `pantry` (ingkey, pantry boolean).
  All three are keyed by ingredient key, so a choice holds for every recipe and list.
- `plugins/shopping_associations/shopping_key_editor_plugin.py`: edit an
  ingredient key's shopping category from the key editor (a combo of existing
  categories). It does not rename keys.
- `defaults/defaults_en.py` `INGREDIENT_DATA`: about 436 (name, key, category)
  rows; categories produce, seafood, meats, spices, baking, dairy,
  international, pastas, wines&oils, bread, soups&sauces, condiments. This is
  the default category table (the web app has none).
- The web version (`legacy/`) only had `shopIgnore` on the source recipe's
  ingredient ("Ignored Items" section); see git history `-S shopIgnore`. 55
  ingredients in a fixtures dump carry `shopIgnore: true`.

### What is built

Three sections, one stored document (nothing written to recipes):

1. **To buy**, grouped by aisle in the user's order, unassigned last ("Other").
   Tapping an item puts it in the cart (`cart: [key]`).
2. **In the cart**, collapsed, this trip only. Tapping puts it back.
   "Done shopping" empties `cart` and `trip`.
3. **Already have** (desktop's pantry, its own label), collapsed, with merged
   amounts. Remembered for every recipe and list: `alreadyHave: [key]`.
   "Already have" on a To-buy item adds it for good. "Buy this trip" adds the key
   to `trip` (cleared by Done shopping). "Don't have it" removes it for good.
   Seeds: the desktop `default_pantry`, matched loosely by words (noise words such
   as "all", "purpose", "extra", "virgin", "kosher", "ground" are ignored, so
   "all-purpose flour" matches "flour, all purpose") and old `shopIgnore: true`
   marks are read, never written, as "already have" hints. `alreadyHaveOff:
   [key]` overrides a seed or hint when the user removes it.

Item keys: a stored `ingkey`, else `shopItem`, else the cleaned `getShopItem`
(see above), lowercased. `keyAliases: {key: key}` records "rename/merge this
item" (Rename... in the aisle row): typing another item's name makes them one.

Aisles: `aisles: {key: name}` (user choices only) and `aisleOrder: [name]` (set by
"Arrange aisles", move up/down). Choosing an aisle is two taps: the aisle chip on
the row opens a row of chips (existing and default aisles, most used first, plus a
"New aisle" box, Enter saves); a chip assigns and closes. With no choice the aisle
is a computed guess (`src/app/shoppingAisles.js`: a small curated keyword table,
then the desktop table converted to `src/app/aisleDefaults.js` with its
categories folded into Produce, Meat & fish, Dairy & eggs, Bakery, Baking, Spices,
Pantry, Frozen, Drinks), shown muted, never stored, replaced by the user's pick.
Default aisle order is the walking order in that list.

Not carried over from desktop: optional-ingredient prompt (the web recipe has no
optional flag); drag and drop (tapping instead); a per-key position inside a
category (`ingorder`, disabled in the desktop code too); printing and saving the
list to a file; the 436-row key table as stored data (used as guess data only);
separate categories for pantry rows (they use the same aisles); multi-select
assigning (one item at a time keeps it two taps).

Stored-shape note (AGENTS rule 2): all of these are new optional fields on
shopping-list documents only; dump before the first real save.

## Old features: keep, drop, defer

| Old feature | Decision |
| --- | --- |
| Add recipe at multiplier; sums if repeated | keep |
| Edit multiplier on the list; remove recipe | keep |
| Merge identical items, add compatible units | keep (kept `addAmounts`) |
| Add a loose item (free text, parsed) | keep |
| Show which recipes an item comes from | keep (compact line under the item) |
| Check off | keep, as "in the cart" for this trip |
| Remove a loose item | keep |
| Clear list | "Done shopping" clears the cart; remove recipes one by one |
| Rename an item / merge two | keep (key alias); "Separate" defer |
| "Ignore" (already have it) | keep, as the pantry (see above) |
| Recipe picker dialog on the list screen | drop; add from the recipe view |
| Add from the recipe list (bulk) | defer |
| Aisles / categories | keep (user aisles + guessed defaults) |
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
- Document `cart`, `alreadyHave`, `aisles`, `reference` and `amount.unit: "recipe"` in
  `public/openapi.yaml`.
