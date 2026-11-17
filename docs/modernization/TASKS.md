# Task cards

Order matters within a phase. `Agent` names a file in `/.claude/agents/`; "lead" means
the top model with Tom reviewing. Every card ends with `verifier` passing.
`[ ]` open, `[~]` in progress, `[x]` done; update in the same PR as the work.

## P0 — Safety net (branch from `dev`, merge to `dev`)

- [ ] **P0-1 Confirm deploy topology** — Tom, 10 min
  Netlify UI: production branch, which branches get branch deploys, previews
  on/off, env vars present. Write the answers at the top of this file.
- [ ] **P0-2 Close the localhost auth path and stop leaking** — lead
  `src/data/functions/api.js`: the `localuser` / `getFakeUser()` branch and the
  fake-user handlers exist only in a local dev build (compiled out, not a
  header test). Remove `user`, `params`, `jsonRequst` from the 400 body. Stop
  logging `userCache` and token prefixes. `remoteRequest.js` sends `localuser`
  only in a dev build. Done when: `Referer: http://localhost` with no token
  gets 401 from a production build; `netlify dev` still works; a test covers both.
- [ ] **P0-3 Database by deploy context** — lead
  Explicit `MONGO_DB_NAME`, default `devtest`; `Gourmet` only for the
  production context and the `dev` branch. Build fails if unset. Done when the
  build log prints the chosen name and a throwaway branch deploy reports `devtest`.
- [ ] **P0-4 Backup** — Tom
  `mongodump` of `Gourmet` or an Atlas snapshot, stored off Netlify.
- [ ] **P0-5 REST contract tests** — `contract-tester`
  Every path in `public/openapi.yaml`, driven through `handler()` against an
  in-memory Mongo. Done when green on `dev` and red if `applyRecipeUpdate` is
  switched back to merging.
- [ ] **P0-6 Tag and branch** — Tom
  Tag `pre-rebuild`. Create `rebuild` from `dev`, enable its branch deploy,
  seed `devtest` with a copy of real recipes.

## R0 — Foundation (`rebuild`)

- [ ] **R0-1 Clear the ground** — `janitor`
  Move UI source to `legacy/` (`src/webapp`, `recDisplay`, `shopDisplay`,
  `account`, `widgets`, `extension`, all `*.demo.svelte`), preserving paths.
  Leave `src/utils`, `importer`, `stores`, `data`, `common`,
  `recDisplay/rec/colors.js` (move to `src/common/`). `shoppingStores.js` goes
  to `legacy/` with its test. Exclude `legacy/` from build, lint and tests.
- [ ] **R0-2 Scaffold** — lead
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
  `rebuild` deploy and see your recipe count.

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

## R3 — Recipe editor

- [ ] **R3-1 Spec** — `legacy-reader` on `Recipe.svelte` (edit mode),
  `IngredientList.svelte`, `IngredientEditor.svelte`, `props/*`
- [ ] **R3-2 Edit-state model, tests first** — lead
  A plain module: load, dirty tracking, save, revert, save-failed. Tested with
  empty, malformed and full recipes before any UI exists.
- [ ] **R3-3 Domain inputs** — `screen-builder`, one PR each
  Ingredient line (free text parsed by the existing parser), amount, duration,
  category (with suggestions), yields, rating.
- [ ] **R3-4 Ingredient list editing** — `screen-builder`
  Add, remove, group, reorder. Reorder with buttons and keyboard first; drag
  later if missed.
- [ ] **R3-5 Text blocks** — lead decides approach, `screen-builder` builds
  Round-trip test: every text body in the seeded `devtest` data loads and
  saves unchanged when untouched.
- [ ] **R3-6 Screen + new recipe + delete** — `screen-builder`
- [ ] **R3-7 Image upload** — spec by `legacy-reader`
  (`widgets/inputs/ImageEntry.svelte`), lead decides resize approach,
  `screen-builder` builds
  Add (file picker, camera on a phone, paste), remove and reorder images in the
  editor. Resize in the browser before saving, to the same stored shape and
  size limits the old app wrote, so old and new images are interchangeable.
  First, a contract test (new, additive): a REST update of a recipe that has
  images, sent without image data, leaves the stored images in place. If it
  fails, stop and report; that is an API decision, not part of this card.

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

- [ ] **R5-1 Design note** — lead + Tom
  Field name and shape, how the parser reads "240 g (2 cups) flour", which
  measure is primary, display rule (both, or preferred with the other on
  demand), how the multiplier and `standardUnit` apply. One page in `docs/`.
- [ ] **R5-2 Parser + normalization + tests** — mid model
- [ ] **R5-3 API** — lead
  Accept and return the new optional field; `RECIPE_SHAPE`, `openapi.yaml`,
  contract tests extended, existing tests untouched and green.
- [ ] **R5-4 View and editor** — `screen-builder`
- [ ] **R5-5 MCP worker** (separate repo): pass the field through; update the tool description.

## R6 — Cutover

- [ ] **R6-1** A week of daily use on the `rebuild` deploy against `devtest` — Tom
- [ ] **R6-2** Point `rebuild` at `Gourmet`; run the MCP against its URL:
  create, update, search, delete a scratch recipe — Tom
- [ ] **R6-3** Merge `rebuild` -> `dev`. Watch function logs for a day.
- [ ] **R6-4** Prod domain to the new build. Delete `legacy/` when nothing in
  `INVENTORY.md` marked `later` still needs it as reference.

## Later — each its own small project

Shopping list with MCP endpoints and family sharing · open-recipe tabs
· sub-recipes · import/export UI · share links · extension (MV3)
