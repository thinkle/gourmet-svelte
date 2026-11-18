# Recipe editor: behaviour spec (R3-1)

Read from `legacy/src/recDisplay/rec/Recipe.svelte` (edit mode),
`ing/IngredientList.svelte`, `ing/IngredientEditor.svelte`, `props/*`, the
widgets they use (`widgets/inputs/IngredientInput`, `DurationInput`,
`StarRating`, `RichText`, `text/RecBlock`), `src/stores/recipeStores.js`,
`src/data/recipeData.js` and the git history of those files. Behaviour only;
none of the old markup or CSS is carried over.

## How editing worked

- **Entering edit mode.** An "Edit Recipe" toggle in the recipe's action menu
  switched the whole recipe into edit mode in place. A recipe with no title
  opened in edit mode on its own. Each property also had its own pencil (and
  double-click) to edit just that property, and the ingredient list had its own
  edit toggle (double-click on the list also turned it on). `RecProp` kept an
  internal edit flag that the whole-recipe toggle overrode (commit 21d8430).
- **What was edited.** The component bound straight into the open recipe
  object (`bind:value={rec[prop.name]}`), which was the entry in the
  `localRecipes` store. There was no separate draft: the open copy *was* the
  draft, and the stored copy in `storedRecipes` was the baseline.
- **Fields** (from `RecDef.js` and `RecPropEditor`):
  | Field | Old editor |
  | --- | --- |
  | title | plain one-line input |
  | categories | multi-combo with suggestions from the categories already in the local cache (`recipeData.getCategories()`), shown as tags |
  | sources | list of `{name, url}` rows (a URL input with a name), add/remove buttons |
  | yields | list of `{amount, unit}` rows (number + unit input) |
  | times | list of `{name, seconds, text}` rows. The duration input had a clock face you could drag, h/m/s boxes, and a free-text box parsed with `times.getSecondsFromString`; typed text was kept as `text` and the parsed number in `seconds` |
  | rating | five SVG stars plus a number box; keys + / - / arrows / digits. It wrote 0-5, but stored ratings run 0-10 (fixtures: 7, 8, 10 are common), so the old editor and the stored scale disagree; the new display already shows `round(n/2)` stars. **Decision: store 0-10, edit as 5 stars, each star = 2.** |
  | images | `ImageEntry` (R3-7, not covered here) |
  | text | list of blocks: a header input and a Quill 1.x rich-text body (toolbar: H1, H2, quote, link, image, video, bold, italic, underline, lists, clean). Shift-Enter inserted a `<br>` via a custom blot |
- **Array props.** Each row had a remove button and an "Add <label>" button
  appended `prop.empty`. On leaving edit mode, rows that `prop.isNull` judged
  empty were filtered out.

## Ingredients

- Each line was a `contenteditable` (`IngredientInput`). The incoming
  ingredient was turned into text as `formatAmount(amount) + unit + text`;
  while typing, the line was re-parsed live with `parseAmount` then
  `parseUnit(rest, true)` (the same split `parseIngredientText` in
  `src/utils/ingredientParsing.js` does now, which the API and importer use),
  and a floating copy showed the amount and unit marked up so you could see
  what was understood. On blur the parsed object replaced the ingredient in
  place (all its keys deleted and replaced, so `shopItem`, `reference` and
  other extra keys were lost).
- Enter split: the current line was committed and a new empty line inserted
  after it and focused. Backspace in an empty line deleted it. A trailing
  "add" input at the end of the list and of each group took the next line.
- Per-line menu: move up, move down, delete, "make into group" (top-level
  lines with no amount only), move out of a group, move into any other group,
  and "add recipe as ingredient" (a link to another recipe:
  `reference`, amount `1 recipe`).
- Groups were `{text, ingredients: []}`. "New Group" at the bottom added an
  empty group with focus on its name; a group could only be deleted once
  empty. Groups did not nest in the UI (only top-level lines could become
  groups) although the data allows it.
- Reorder used `svelte/animate` flip with the move buttons; drag was
  not implemented here.

## Save, revert and dirty state

- **Dirty.** `recipeState` (derived from `localRecipes` and `stored`) ran
  `diffRecs(local, stored)` from `src/data/utils/diff.js` over the RecDef
  props, images and ingredients. Empty arrays counted as equal to missing ones.
- **Save.** The Save button (shown only when edited) called
  `recipeActions.updateRecipe(rec)` -> `recipeData.updateRecipe(rec)`:
  stamp `last_modified`, try the server (`update` if there is an `_id`, else
  `add`), then write the local cache (`savedRemote` 1 on success, 0 on failure
  so the next sync uploads it). "Save to Cloud" appeared when the local copy
  was not saved remotely. Edit mode turned off after the save resolved; a
  failed save showed nothing (the remote error is caught and logged inside
  `recipeData`), only the status icon changed to `cloud_off`.
- **Revert.** `recipeActions.revertRecipe(id)` re-read the recipe from
  IndexedDB (commit e77abd5: "rather than trusting the store since it might
  have been edited in another tab") and replaced `localRecipes[id]`.
- **Closing a tab** with unsaved edits asked for confirmation.
- **New recipe.** "New recipe" called `recipeActions.createRecipe({})`, which
  wrote an empty recipe to the cache and the server *immediately* and opened
  it in edit mode (no title -> edit mode).
- **Delete.** Only from the recipe list's multi-select, no confirmation:
  `recipeData.deleteRecipe(id)` loads the row, sets `deleted = true` and calls
  `updateRecipe` (soft delete; the list filters `deleted`).

### Where it broke

Read from the code and history; these are why the new model is a separate,
tested module rather than a reuse of `recipeStores`:

1. **No draft.** The view bound into the very object the stores held, so
   anything that touched it (a display component writing a default) changed
   "the draft". `RecProp` did exactly that: `if (prop.array && !value) value = []`
   wrote empty arrays into the recipe just by rendering it.
2. **Aliasing.** `localRecipes` held one object under both its local `id` and
   its `_id`; `revertRecipe` replaced only `[id]`, so the two keys diverged.
   `setStoredRec` stores `data[rec._id] = rec` uncopied (the same object
   `recipeData.updateRecipe` mutates) while `data[rec.id]` is a merged copy.
3. **Merge instead of replace.** `setStoredRec` merges the saved recipe over
   the previous stored one (`{...old, ...new}`, commented "I may regret this"),
   so a field removed in the editor survives in the baseline, and the next diff
   is wrong.
4. **Dirty state bug.** `recipeState` writes `recState.changes = diff` at the
   top level, not per recipe.
5. **Silent failure.** A failed remote save is swallowed in `recipeData`; the
   UI only learns from `savedRemote`. A failed *local* write rejects, and the
   old Save handler had no catch, so edit mode simply stayed on.
6. **Replace-in-place for ingredients** (`changeIngredient` deletes every key
   then copies the parsed ones) dropped extra fields such as `shopItem`,
   `reference`, `optional`. Moving a line did not call `onChange`.
7. **Quill** rewrote any body it loaded (its own `<p>` structure, `<br>`
   handling, class names) as soon as it was shown, so opening a recipe in edit
   mode could change bodies that were never touched.

Kept-logic issues found while reading (reported, not changed, rule 6):

- `recipeData.deleteRecipe` calls `this.updateRecipe(recipe)` without
  `await`, so callers cannot know when, or whether, the delete was written.
- `recipeData.addRecipe` with no server leaves `savedRemote` unset on the
  local row, so `sync()` (which looks for `savedRemote: 0`) never uploads a
  recipe created offline.
- `recipeData.updateRecipe` and the Dexie layer mutate the object they are
  given (`last_modified`, `savedRemote`, and `prepRecLocal` adds `words`,
  `ings`, `categoryNames`, `sourceNames`, `deleted` 0/1, `share` 0/1, and
  empty `images`/`ingredients`). Callers must hand them a copy.

## What the rebuild does now (R3-2 to R3-6, first pass)

**State model** (`src/app/editState.svelte.js`, pure helpers in
`src/app/recipeEdit.js`): one `RecipeEdit` per recipe being edited.

- `original` is a deep copy of the stored record (the raw row, not the
  screen's prepared copy); `draft` is a second deep copy. The UI writes only
  to the draft, and only when the user changes something: no defaults are
  written on render. Fields that are missing are *shown* as empty and only
  created on first edit.
- `dirty` is structural: a key-order-insensitive deep comparison of draft and
  original (`undefined` treated as absent, like JSON). `changed` lists which
  top-level fields differ.
- `save()` hands a copy of the draft to the kept data layer: the same call
  the old app used, `recipeData.updateRecipe` for an existing recipe;
  `recipeData.addRecipe` for a new one (followed by `updateRecipe(…, false)`
  when the server was not reached, so `sync()` uploads it later). On success
  original and draft become copies of what the data layer returned. If the
  user typed during the save, their newer draft is kept (still dirty).
- Save failure: the draft stays as it was and dirty; `status` is `"error"`
  and `error` holds the message; `save()` can simply be called again.
  "Saved here but not on the server" (`savedRemote` falsy after save) is shown
  as such, not as an error: the next sync uploads it.
- `revert()` restores the draft to an exact copy of the original.
- `remove()` is the soft delete: the stored record with `deleted: true`
  through `recipeData.updateRecipe` (what `recipeData.deleteRecipe` does, but
  awaited; see above).
- `recipeStores` is not wrapped: it is a global map keyed by both ids with
  merge semantics (problems 2 to 4), it reads only from IndexedDB (fixtures
  mode has nothing there), and it would add a second copy of every recipe
  beside `library`. The module is thin over `recipeData` instead.

**Fields.** Title; categories (free text with suggestions from the library's
categories, as removable tags); yields (`amount` typed naturally with
`AmountInput`'s parser, plus unit); times (name + free text like
"1 hr 15 min", parsed on blur with `times.getSecondsFromString`, keeping the
typed text in `text` as the old editor did; the parsed duration is shown
beside it); rating (5 stars, stored 0-10); sources (name + URL rows).

**Ingredients.** A line of text per ingredient, shown as
`amount unit text`. On blur, if (and only if) the text changed, it is parsed
with the kept `parseIngredientText`; extra keys on the old ingredient
(`shopItem`, `reference`, …) are kept, amount and text are replaced. The
parsed amount and unit are shown beside the line so the user sees what was
understood. Enter adds a line below; Backspace in an empty line removes it;
Alt+Up / Alt+Down move a line (also buttons). Lines can move into or out of
a group. Groups: add, rename, remove (removing a non-empty group asks, and
its lines move up to the top level rather than being lost). No drag.
Ingredients stored as plain strings are shown as lines and converted to
objects only when the list is edited.

**Text blocks: approach (R3-5).** Each block has a header input and a body
edited in a `contenteditable` region with a small toolbar (bold, italic,
bulleted list, numbered list). The rule that protects existing HTML is
*no write unless edited*: the body field is never re-serialized on load,
focus or blur, only on an `input` event in that body. The region shows
`bodyHtml(body)` (the same sanitizer the view uses, so nothing unsafe is
ever put into the page). When the user does type, the region's HTML is
cleaned with the same allow-list (`sanitizeBody` in `recipeText.js`) and
written back. Plain-text bodies (from agents) are shown laid out; they become
HTML only if edited. Not Quill: its document model normalizes HTML on load
(problem 7). Tested: an untouched body, including odd HTML the sanitizer
would change, saves back byte-identical; cleaning is idempotent on its own
output. Blocks can be added, removed and reordered. A body stored as a single
string (`text: "…"`) is shown as one block and converted to `[{header, body}]`
only when edited.

**Screen (R3-6).** An Edit button in the recipe view switches that open
recipe into edit mode in place (same two panes: ingredients left, the rest
right; stacked on a phone). Save, Revert (confirm when dirty), Cancel
(confirm when dirty, then leave edit mode with the draft discarded). A tab
being edited shows that it has unsaved changes. "New recipe" on the recipe
list opens an unsaved recipe in edit mode; it is written on first Save.
Delete (in edit mode) asks for confirmation, soft-deletes, and closes the tab.

## Later

- R3-7 images (left untouched; the draft carries `images` through as is).
- Drag to reorder ingredients and blocks.
- "Add recipe as ingredient" (references) and editing a reference line's link.
- Making an existing line into a group; nested groups.
- Links, headings and other formatting in the body toolbar; an HTML source view.
- Undelete UI; per-property quick edit outside edit mode.
- The full-dump round-trip test from the R3-5 card (every body in a dump of
  Tom's recipes) needs a dump on disk and Tom to run it; the test here uses
  fixtures and hand-written edge cases.
