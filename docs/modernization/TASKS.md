# Task cards

Order matters within a phase. `Agent` names a file in `/.claude/agents/`; "lead" means
the top model with Tom reviewing. Every card ends with `verifier` passing.
`[ ]` open, `[~]` in progress, `[x]` done; update in the same PR as the work.

## P0 — Safety net (on `dev`, before R0 changes it; then `master` is fast-forwarded to `dev`)

- [x] **P0-1 Confirm deploy topology** — read from the Netlify API, 2026-11-16
  One site, `gourmet-svelte`. Production branch `master` (www). Every other
  branch gets a branch deploy at `<branch>--gourmet-svelte.netlify.app`;
  `dev` is also dev.gourmetrecipemanager.com. `MONGO_URL` is the same in every
  context. Netlify Identity is on the site, so all deploys share sign-in.
- [x] **P0-2 Close the localhost auth path and stop leaking** — lead, done 2026-11-16 (`rb/p0-2-close-localhost-auth`)
  `src/data/functions/api.js`: the `localuser` / `getFakeUser()` branch and the
  fake-user handlers exist only in a local dev build (compiled out, not a
  header test). Remove `user`, `params`, `jsonRequst` from the 400 body. Stop
  logging `userCache` and token prefixes. `remoteRequest.js` sends `localuser`
  only in a dev build. Done when: `Referer: http://localhost` with no token
  gets 401 from a production build; `netlify dev` still works; a test covers both.
- [x] **P0-3 One database, named on purpose** — lead, done 2026-11-16 (`rb/p0-3-one-database`)
  Decided 2026-11-16: prod, `dev`, previews and local dev all use
  `Gourmet`. Make that explicit: one constant, no build-time text replacement
  (the cluster has a stray database literally called `MONGO_DB_NAME` from when
  the replacement did not run). The function logs the database name once at
  cold start. Tests cannot reach it: `mongoConnect` refuses to connect under
  the test runner unless the URL is the in-memory server. Done when a local
  build, a branch deploy and prod all log `Gourmet` and a test proves the guard.
- [x] **P0-4 First backup** — done 2026-11-16
  `scripts/migrate/dump.mjs` wrote all three databases on the cluster to
  `~/gourmet-dumps/cluster-20261117-013704` (outside the repo).
- [ ] **P0-8 Backups as a habit** — lead + Tom
  Sharing one database makes this the safety net. The free Atlas tier has no
  snapshots (**verify**). Decide and set up: a scheduled dump (where it runs,
  where the files go, how many are kept), plus a dump before merging any PR
  that touches `netlify/functions` or stored recipe shape. Document a restore
  of one recipe and of everything, and try each once against a scratch
  database.
- [x] **P0-5 REST contract tests** — `contract-tester`
  Every path in `public/openapi.yaml`, driven through `handler()` against an
  in-memory Mongo. Done when green on `dev` and red if `applyRecipeUpdate` is
  switched back to merging.
- [ ] **P0-6 Tag and branch** — Tom
  When P0-2, P0-3 and P0-5 are merged: tag `pre-rebuild` and fast-forward
  `master` to `dev`, so production has the fixes before R0 changes `dev`.
- [x] **P0-7 Local cache drops recipes on a fresh sync** — done 2026-11-16 (671adbf, on `dev` and `master`)
  Found 2026-11-16: 33 of 727 recipes, every MCP-created one included, are
  missing from a newly synced browser. Server recipes carry the local `id` of
  the device that made them (or none), and the cache writes them to that slot,
  overwriting other recipes. Fix in `src/data/recipeData.js` /
  `local/dexieApi.js`: a recipe from the server reuses the local row that
  already has its `_id`, otherwise gets a fresh local id; its stored `id` is
  ignored. An approved exception to "kept logic is not yours to change". Done
  when a test syncing id-less and id-colliding recipes into an empty cache
  keeps them all. Branch `rb/p0-7-cache-id-collision`.

## R0 — Foundation (`dev`)

Changed 2026-11-17: the UI spike was good enough to keep, so it was promoted
instead of rebuilt from specs. `rb/r0-promote-spike` did R0-1 and R0-2 and
part of R0-4, R0-7 and R0-8 in one go, and brought working first versions of
R1-3, R2-2, R2-3 and R2-4 with it:

- The API function is `netlify/functions/api.js`, bundled by Netlify with
  esbuild; the built `functions/api.js` is no longer committed. Still to do
  from R0-4: the MongoDB driver upgrade.
- `src/auth/session.js` is a thin bridge from the Netlify Identity widget to
  the kept `userStore`. R0-7 (token refresh per request, 401 retry) is still
  to do behind that file. Local sign-in under `netlify dev` does not work
  until then; use `/?fixtures` with a local `src/app/fixtures.local.json`.
- `src/app/library.svelte.js` reads the kept local cache and runs the kept
  sync. The shell has signed-out, signing-in, loading, error and ready
  states. Still to do from R0-8: routes (URL per recipe), the new-user
  agreement, a proper sync indicator.
- The list, recipe view, highlighting and amounts came over as built in the
  spike. They have no tests and no specs yet: R1 and R2 cards now mean
  "bring this up to the card's done-when", not "build from nothing".
- Tests: only `npm run test:api` (Jest, contract tests) runs. R0-3 (Vitest
  for kept logic) is next and unblocks everything else.

- [x] **R0-1 Clear the ground** — `janitor` — done 2026-11-17 (`rb/r0-promote-spike`)
  Move UI source to `legacy/` (`src/webapp`, `recDisplay`, `shopDisplay`,
  `account`, `widgets`, `extension`, all `*.demo.svelte`), preserving paths.
  Leave `src/utils`, `importer`, `stores`, `data`, `common`,
  `recDisplay/rec/colors.js` (move to `src/common/`). `shoppingStores.js` goes
  to `legacy/` with its test. Exclude `legacy/` from build, lint and tests.
- [x] **R0-2 Scaffold** — lead — done 2026-11-17, from the UI spike
  Vite + `@sveltejs/vite-plugin-svelte`, `svelte@5`, `contain-css-svelte`,
  `page`. Remove Rollup, Babel, SCSS. `DEV`/`BUILD_*` via `define`. `netlify
  dev` proxies to Vite. Blank page renders a Contain `Page`.
- [ ] **R0-3 Vitest for kept logic** — `janitor`, lead reviews failures
  Port Jest config; `fake-indexeddb`; current `@testing-library/svelte`. Every
  test under the kept directories passes. None deleted; anything unportable is
  listed, not removed.
- [ ] **R0-4 Function build** — lead
  Source to `netlify/functions/api.js`, bundled by Netlify. Stop committing the
  built `functions/api.js`. MongoDB driver 3.6 -> current: `mongoConnect.js`
  loses the driver-internals check and callback connect. Contract tests gate it.
- [ ] **R0-5 Dependency sweep** — `janitor`
  Remove what nothing kept imports: `faunadb`, `querystring`, `node-fetch`,
  `quill`, `svelte-quill`, `svelte-dnd-action`, `svelte-moveable`,
  `svelte-infinite-scroll`, `svelte-watch-resize`, `svelte-i18n`, `rangy`,
  `scrollparent`, `sirv-cli`, `netlify-identity-widget` (after R0-7),
  `jest*`, `babel*`, `rollup*`. One group per commit, checks after each.
  `pica` stays until R3-7 decides how images are resized.
- [ ] **R0-6 Theme** — lead
  `src/theme/gourmet.css` from the variable map in `CONTAIN_NOTES.md`. Recipe
  accent as a role. Fonts. Light and dark if Contain gives it for free.
- [ ] **R0-7 Auth module** — lead
  `src/auth/` per the plan's design note, on `@netlify/identity`.
  `userStore.js` keeps profile + `remoteUser`, no token fields.
  `remoteRequest.js` calls `getToken()` per request, retries once on 401.
  Function: 401 (not 400) for auth failures on the RPC path; `userCache`
  dropped or given a TTL. Tests: expired token refreshes; refresh failure ends
  signed out, never half signed in.
- [ ] **R0-8 App shell** — lead
  `Page` with bar, routes registered (same URL shapes as today), states for
  signing in / signed in / session expired / error, new-user agreement, sync
  status indicator wired to `statusStore`. Done when you can sign in on the
  `dev` deploy and see your recipe count.

## R1 — Recipe list

- [ ] **R1-1 Spec** — `legacy-reader` on `legacy/src/recDisplay/RecipeList.svelte`
- [ ] **R1-2 Two-view spike** — lead
  Same data as a `DataList`/`Table` and as a `Card` grid with recipe colours.
  Tom picks one or both. Record the choice in `CONTAIN_NOTES.md`.
- [ ] **R1-3 Build** — `screen-builder`
  Search, category filter, sort, load-more, open. Empty, loading, error states.

## R2 — Recipe view

- [ ] **R2-1 Spec** — `legacy-reader` on `Recipe.svelte` (view mode only),
  `ing/Ingredient.svelte`, `text/RecipeText.svelte`, `text/IngHighlight.svelte`
- [ ] **R2-2 Amount display + multiplier** — `screen-builder`
  One `Amount` component using `utils/numbers.js` and `unitAmounts.js`;
  fractions and ranges render as today. Unit tests for scaled output.
- [ ] **R2-3 Highlighting** — lead (first), tests required
  State object `{highlighted, hover, active}` shared by ingredient lines and
  marked-up text. Hover and click both ways; scroll the other side into view
  once; on a narrow screen the ingredient panel reveals the highlighted item.
  Uses `parseIngredients` and `highlightItem` unchanged.
- [ ] **R2-4 Screen** — `screen-builder`
  Layout: ingredients beside text on wide containers, stacked on narrow,
  by container query. Groups, properties, images, sources with links. Print.
- [ ] **R2-5 Timers** — spec by `legacy-reader` (`widgets/display/TimeLink.svelte`,
  `widgets/controls/Timer.svelte`, the timer parts of `RecipeText.svelte` and
  `Toaster.svelte`), then `screen-builder`
  Times in recipe text and in the time properties are clickable and start a
  timer. Running timers stay visible while moving between recipes and say
  which recipe they belong to. Uses `utils/timerDrawer.js` and `utils/times.js`
  unchanged. Done when: several timers run at once, one survives navigating
  to the list and back, and finishing is noticeable on a phone.
- [ ] **R2-6 Tom starts using it** — read-only, alongside the old app.

- [x] **R2-7 Cloud refresh and bookmarked recipe tabs** — owner request,
  2026-11-25. One app-layer task: expose the kept sync through a Sync recipes
  button (busy/disabled state, visible failure and retry); keep open recipe
  views and drafts mounted. Follow-up (2026-11-26): cloud sync icon and subtle
  top-bar buttons that blend into the bar and reveal their shape on hover or
  keyboard focus; icon labels remain accessible on phones. Remember saved open
  recipes and the active tab in sessionStorage, scoped to the account and each
  browser tab, leaving ordinary URLs short. Duplicated tabs begin with copied
  session state, then diverge. A Bookmark link dialog offers copy/manual copy
  and opening the recipe set in a new browser tab. Explicit links retain
  `#recipes=…&tab=…` and override session state, using stable server IDs with
  `local:<id>` fallback. Existing bookmarks still work. Restore after initial
  sync; skip unavailable IDs and unsaved new drafts. Hash changes retain dirty
  tabs. No dedicated single-recipe pop-out action yet. Unit tests cover URL
  mapping across caches, independent sessions/account isolation, restricted
  storage, empty explicit links, sync arrivals, concurrency and failure/retry.
  Verified by 144 Vitest tests, a production build and headless Chromium checks
  at desktop/phone sizes using local/mock data: independent tabs and refresh,
  bookmark precedence/copy/new window, clipboard fallback, busy/error/retry,
  retained multiplier/drafts, and toolbar hover and keyboard focus.
  REST checks remain blocked by the MongoDB binary download returning HTTP 403;
  this checkout has no `check` script.

- [x] **R2-8 Recipe color tones** — owner requested 2026-11-26. Keep recipe
  palettes as filled roles; map their local primary pair and text ingredient
  through Contain on a neutral recipe Surface. Scaled amounts, multiplier and
  rating use primary text tones (35% tint); highlight amounts use the note
  family's ink pin. Headers and the phone sheet declare their surfaces.
  Recipe styling lives in the theme. No API, stored data or kept logic changes.
  Browser checks use an in-memory synthetic recipe and both light/dark neutral
  palettes; all 71 recipe palettes keep amount/input/prose tones consistent.
  Minimum measured contrast: 4.82:1 for tints, 12.12:1 for highlights. Checked
  the dark phone sheet and desktop editor without saves. Build, 179 API tests
  (2 skipped), and 181 Vitest tests pass; no `check` script exists.

- [x] **R2-9 Linked recipes** — owner requested 2026-11-26. Underlined
  ingredient controls open/focus the target tab, including grouped ingredients
  and the phone sheet. Shopping expands chains with path-local cycle detection
  for both local and API-only recipe IDs; repeated independent branches count.
  Document existing REST reference/batch semantics in OpenAPI and recipes/schema;
  contract-test create/read/update preservation. Read-only live Thanksgiving
  menu has IDs in prose and no linked ingredients. MCP source located in the
  separate nutrition-tracker Cloudflare worker and explicitly documented/typed
  there, with five mocked MCP handler tests. Worker deployed at owner request
  on 2026-11-26; connected tool-schema refresh remains pending. Web fix committed
  to local dev at owner request; pushing/deployment remains pending. No live
  recipe writes. See `specs/linked-recipes.md`.

- [x] **R2-10 Sign in from manual cloud sync** — owner reported 2026-11-26.
  Sync stays available when signed out and opens sign-in before making a remote
  request if the user/token is missing or expired. A server auth rejection
  offers sign-in instead of a generic sync error, keeping cached recipes.
  Startup auth rejection offers a sign-in action without opening a modal.
  Ordinary network failures remain retryable. An old failed sync cannot restore
  an error after logout. Kept request/store/sync code and API are unchanged.
  Small fixes may commit directly to local dev per the owner's updated policy.
  Verified: build passed, 223 app tests passed (baseline 216), 181 API tests
  passed with 2 existing skips. Browser: signed-out Sync opens the login form,
  makes zero recipe requests, and fits at 390 px. Independent verifier passed.
  No check script exists; existing bundle-size warning remains.

## R3 — Recipe editor

- [x] **R3-1 Spec** — `legacy-reader` on `Recipe.svelte` (edit mode),
  `IngredientList.svelte`, `IngredientEditor.svelte`, `props/*`
  Done (`rb/r3-editor`): `specs/recipe-editor.md`, incl. where the old save/revert broke.
- [x] **R3-2 Edit-state model, tests first** — lead
  Done (`rb/r3-editor`): `src/app/editState.svelte.js` over `recipeData` (not `recipeStores`, see spec); Vitest added (`npm test`).
  A plain module: load, dirty tracking, save, revert, save-failed. Tested with
  empty, malformed and full recipes before any UI exists.
- [~] **R3-3 Domain inputs** — `screen-builder`, one PR each
  First pass (`rb/r3-editor`): ingredient line, yields, times (typed), category with suggestions, stars. Left: a reusable amount+unit input; a duration picker.
  Ingredient line (free text parsed by the existing parser), amount, duration,
  category (with suggestions), yields, rating.
- [x] **R3-4 Ingredient list editing** — `screen-builder`
  Done, first pass (`rb/r3-editor`): add/remove/reorder by buttons and Alt+arrows, through groups; groups add/rename/ungroup. No drag; no recipe references.
  Add, remove, group, reorder. Reorder with buttons and keyboard first; drag
  later if missed.
- [~] **R3-5 Text blocks** — lead decides approach, `screen-builder` builds
  First pass (`rb/r3-editor`): contenteditable + small toolbar, no write unless edited; round trip tested on fixtures. Left: run the test on a real dump (`GOURMET_DUMP=… npm test -- --run`).
  Round-trip test: every text body in a dump of Tom's recipes
  (`scripts/migrate/dump.mjs`, read from disk, never committed) loads and
  saves unchanged when untouched.
- [x] **R3-6 Screen + new recipe + delete** — `screen-builder`
  Done, first pass (`rb/r3-editor`): Edit in place, Save/Revert/Cancel, New recipe, soft Delete with confirm, dirty tabs.
- [x] **R3-7 Image upload** — spec by `legacy-reader`
  (`widgets/inputs/ImageEntry.svelte`), lead decides resize approach,
  `screen-builder` builds
  Add (file picker, camera on a phone, paste), remove and reorder images in the
  editor. Resize in the browser before saving, to the same stored shape and
  size limits the old app wrote, so old and new images are interchangeable.
  First, a contract test (new, additive): a REST update of a recipe that has
  images, sent without image data, leaves the stored images in place. If it
  fails, stop and report; that is an API decision, not part of this card.
  Implemented 2026-11-26 at owner request: upload, clipboard paste and HTTPS
  URL import, captions, removal and ordering. Browser resize retains the legacy
  1200px longest edge and data-URL image objects. URL imports use a new signed-in,
  read-only download function, bounded to 4 MB, with public-IP checks and pinned
  DNS on each redirect; no database access. File uploads allow up to 10 MB.
  Pending photo work cannot save late after Cancel/Revert. REST photo-preservation
  prerequisite passed. Prepared image and aggregate photo budgets guard the
  save payload size. Build, 234 app tests and 207 API tests pass (2 existing
  skips); new function bundle and public-image download check pass.
  No stored-shape or existing API write-path changes.

## R4 — Account

- [ ] **R4-1** API tokens: list, create (shown once), revoke — `screen-builder`
- [ ] **R4-2** Name — `screen-builder`
- [ ] **R4-3 Linked accounts** — spec by `legacy-reader` (`legacy/src/account/`),
  then `screen-builder`
  See who is linked, invite by email, accept or decline an invite, unlink.
  Uses the existing requests in `src/data/requests` and the handlers in
  `userFunctions.js` unchanged. Tests against in-memory Mongo with two users:
  invite, accept, both see the same recipes, unlink. The spec must state what
  happens to each account's own recipes on link and on unlink (**verify** from
  `api.js`: `user.account = dbUser.linked || user.email`) before any UI is built.

## R5 — Multiple measures

- [x] **R5-1 Design note** — lead + Tom, drafted 2026-11-17: `docs/modernization/multiple-measures.md` (open decisions for Tom at its top)
  Field name and shape, how the parser reads "240 g (2 cups) flour", which
  measure is primary, display rule (both, or preferred with the other on
  demand), how the multiplier and `standardUnit` apply. One page in `docs/`.
- [x] **R5-2 Parser + normalization + tests** — `altAmounts` from `(...)` and `/` in `src/utils/altAmounts.js`; tests in `altAmounts.test.js`; dry-run script `scripts/migrate/alt-measures-dry-run.mjs`
- [x] **R5-3 API** — lead; field accepted, parsed and returned; new tests in `api.altAmounts.contract.test.js`, existing ones untouched
  Accept and return the new optional field; `RECIPE_SHAPE`, `openapi.yaml`,
  contract tests extended, existing tests untouched and green.
- [~] **R5-4 View and editor** — `screen-builder`; view done (`Measures.svelte` in `Ingredients.svelte`), editor input still to do
- [ ] **R5-5 MCP worker** (separate repo): pass the field through; update the tool description.

## S — Shopping list

Back in scope; spec in `specs/shopping-list.md`. Branch `rb/shopping-list`.

- [x] **S-1 Spec** from the old store, `shopDisplay` and `Recipe.svelte`.
- [x] **S-2 First version.** "Add to shopping list" in the recipe view (at the
  current multiplier); a "Shopping list" tab (phone too) with merged items
  (kept `getShopItem`, `addAmounts`, `formatAmount`), tick-off, recipes on the
  list with editable multiplier and remove, loose items. Stored as the
  `isShoppingList` recipe document and saved through `recipeData` (fixtures mode
  and signed-out sessions save to the local row only). `legacy/` store not
  reused: it is bound to the old stores; new code is `src/app/shopping*.js`.
- [x] **S-2b Desktop structure.** Three sections (To buy by aisle, In the
  cart with "Done shopping", Already have seeded from the desktop
  `default_pantry` and old `shopIgnore`), aisles with a two-tap chip picker,
  editable aisle order, guessed default aisles (curated keywords plus the
  desktop's default table), rename/merge by key alias. Stored on the list
  document: `cart`, `alreadyHave`, `alreadyHaveOff`, `trip`, `aisles`,
  `aisleOrder`, `keyAliases`. Stored `ingkey`/`shopItem` is the item key when
  present. No pantry editor (the pantry was a metaphor). See the spec.
- [x] **S-2c Shopping list clarity** — compact pantry/tag CircleButtons with
  hover/focus descriptions; double-door pantry icon (also in its summary), and
  cart icon by ingredients. "Pantry Items" replaces "Already have" (owner,
  2026-11-25); its icon follows Contain's current surface when expanded.
  Checkbox-led rows cross off and restore in place. Recipe attribution is
  smaller and muted, with an expandable original ingredient line. Rename/merge
  aliases preserve recipe wording and are remembered on the list document.
  Aisle picker: current/suggested choice, up to seven buttons or a rich Select
  with icons; native text-only select on phones. Default aisle colors wrap the
  section, including checkbox borders/fills and row tools. Eighteen store-style
  defaults split Meat/Seafood/Deli, canned/grains/international, and coffee/tea,
  cereal/breakfast, soda/water, juice and alcohol. Legacy Pantry assignments
  display "Misc (choose an aisle)"; stored assignments/keys are unchanged.
  Verified with local fixtures at desktop/phone sizes, including both picker
  variants, checkbox/row/keyboard toggles, captions, and expanded pantry colors.
  Aisle/naming tests cover suggestions, packaging precedence, explicit choices,
  the owner's full onion example and aliases; build and both test runners pass.
- [x] **S-2d Shopping ingredient note boundaries** — restore the desktop's
  semicolon boundary in the shopping-name adapter. The sugar adjustment note
  must stay in the expandable original line and stay out of naming, merging,
  pantry matching and aisle guessing. Stored ingkey/shopItem values stay
  authoritative; kept parsers, API and recipe wording remain unchanged.
  Eight regression cases cover the sugar example, merging, other delimiters,
  stored keys and malformed note-only text. Verified the before/after name
  and preserved original line in a read-only fixture; build, 145 API tests
  and 140 Vitest tests pass.
- [x] **S-2e Automatic shopping unit promotion — WONTFIX** (owner, 2026-11-25).
  Keep `addAmounts` behavior: combine compatible amounts using the largest
  unit already present. Do not promote a tablespoons-only total to cups or
  gallons using ad hoc thresholds. Python had a readability scorer and unit
  preferences; there is no equivalent selector in the kept JS. Revisit only
  with a deliberate, tested readability policy. No unit code changed.
- [x] **S-2f Readable shopping quantities** — owner approved 2026-11-25,
  superseding S-2e's deferral after investigating the Python implementation.
  Scope: `src/utils/unitAmounts.js` (repair comma-operator unit groups, expose
  Python-derived readability scoring/selection, preserve ranges and zeroes in
  addition), `src/utils/numbers.js` (display a zero lower range endpoint),
  `src/app/shoppingList.js` (select units after aggregation), regression tests
  in `src/app/shoppingUnits.test.js`, and `docs/modernization/shopping-units.md`.
  Keep Python fraction scores/ranges and optional current-unit bias. Score final
  totals once, including single lines; select one unit for both range endpoints.
  Keep existing fl oz when readable, but do not introduce it from other units.
  Recognize pint/quart inputs without introducing them as new display choices.
  No density conversion, API/stored-shape changes or recipe-view promotion.
  Done when: 20 Tbs -> 1¼ c; 3 tsp -> 1 Tbs; 1500 g -> 1½ kg; 15 fl oz stays;
  2 c stays; ranges, zeroes, unknown units and original recipe data survive;
  mixed-unit order does not affect the result; build and both test runners pass.
  Verified: build, 145 API tests and 162 app tests pass; independent verifier
  PASS WITH NOTES. Extra kept-utility Jest failures match unchanged baseline.
- [x] **S-2g Direct shopping-item editor** — put Shopping Ingredient, original
  recipe lines and Category in one dialog; save name/category together, retain
  drafts on failure, and let Cancel discard both. Custom-category entry starts
  collapsed. Compact the dialog's close/header spacing; use existing alias and
  category writes without changing recipe wording, stored shape or REST API.
  Verified desktop/390px preview, focus, rename+category persistence, Cancel
  and Escape, custom/automatic categories, merge totals/original lines, and
  retry after an injected category-save failure in an isolated local cache.
  Build, 145 API tests and 140 Vitest tests pass.
- [x] **S-2h Open recipes from the shopping list** — recipe titles in the
  recipes-on-list section and expanded ingredient references open/focus the
  existing recipe tab. Source links use local recipe ids, including when titles
  are duplicated or list references use Mongo ids. Missing recipes stay plain
  text. Links do not cross off items. Verified mouse/keyboard, tab reuse and
  phone layout with synthetic fixtures; build, 145 API tests and 166 Vitest
  tests pass. API, stored shape and recipe data are unchanged.
- [ ] **S-3 Tom checks it against real data**: dump first
  (`scripts/migrate/dump.mjs`); the fields above are new on list documents. Decide
  what to do about the spare empty shopping-list documents.
- [ ] **S-4 Tests**: unit tests for `buildList` and the save path once `npm test`
  exists (R0-3); none added now because the only runner is the API one.
- [ ] **S-5 Later**: aisles; rename or split a merged item; multi-select aisle assigning; add from the recipe list; list as MCP endpoints (see the spec's last section);
  family sharing; item names from `getShopItem` can read oddly ("Purpose Flour"
  for "all-purpose flour": kept logic, reported, not patched).

- [~] **S-7 Shopping-list MCP control** — owner requested 2026-11-25; separate
  branch `rb/s-7-shopping-mcp`, from `dev`, independent of S-6 live sync. Owner's
  confirmed dump from this session precedes backend write changes. Additive
  `/shopping-list` reads and commands: add loose item, add recipe/multiplier,
  remove merged item from this list only, remove recipe reference, categorize
  one/many keys (null restores suggestions). Conditional field updates preserve
  cart/pantry/images/live metadata. Reuse the app's merged view; new optional
  `excludedItems` keeps removed recipe-derived items off this list without
  changing source recipes. The Netlify entrypoint routes new paths while
  existing recipe paths delegate unchanged. No edits to kept logic. OpenAPI,
  API tests and app exclusion tests included. Actual MCP tool registration
  requires the separate MCP server's source location, requested from the owner.
  API-side verification: build and standalone function bundle pass; 179 API
  tests pass (2 existing skips), 169 app tests pass; all OpenAPI references
  resolve. No real-database test writes. Separate MCP tool registrations remain
  pending their source location.
  See `specs/shopping-mcp.md` for the integration contract and trial steps.

## R6 — Cutover

- [ ] **R6-1** A week of daily use on the `dev` deploy — Tom
- [ ] **R6-2** Run the MCP against the `dev` URL: create, update, search,
  delete a scratch recipe — Tom
- [ ] **R6-3** Merge `dev` -> `master`. Watch function logs for a day.
- [ ] **R6-4** Prod domain to the new build. Delete `legacy/` when nothing in
  `INVENTORY.md` marked `later` still needs it as reference.

## Later — each its own small project

Shopping list with MCP endpoints and family sharing
· import/export UI · share links · extension (MV3)
