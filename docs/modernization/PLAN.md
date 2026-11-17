# Gourmet rebuild plan

Revised 2026-11-16. Replaces the earlier in-place upgrade plan: the UI is
rebuilt from scratch on Svelte 5 + Contain, scoped to what Tom uses, while the
existing app keeps running untouched. Written from a read-through of
`gourmet-svelte` (`dev`, 2560ff0) and `contain-css-svelte` 1.8.1; nothing was
built or run, so items marked **verify** are readings of the code.

Companion files: `INVENTORY.md` (what is in scope), `TASKS.md` (ordered cards),
`CONTAIN_NOTES.md` (theme, component choices, gap log), `/AGENTS.md` (rules),
`/.claude/agents/*.md` (sub-agent definitions).

## Why rebuild rather than port

- The parts of Gourmet worth keeping are not components: ingredient, amount,
  unit and time parsing; the stores and local/remote sync; the request layer;
  the Netlify function. All of it is plain JS, most of it tested, and
  `svelte/store` works unchanged in Svelte 5.
- About 60 of the ~120 components are a generic widget kit that Contain replaces
  outright. Porting them means writing adapters that exist only to be deleted.
- The screens are built around layout ideas (full-screen frame, toolbar context,
  fixed SCSS card sizes) that Contain does differently. A port drags them along.
- The scope Tom cares about is small: browse, read, scale, edit, with ingredient
  highlighting. That is a few screens, not a migration.

## What is kept, rebuilt, dropped

| Kept as is (moved, not rewritten) | Rebuilt on Svelte 5 + Contain | Not carried over |
| --- | --- | --- |
| `src/utils/*` parsing: amounts, units, times, ingredient text matching | App shell, routing, sign-in states | `src/widgets/*` (Contain replaces it) |
| `src/importer/*` | Recipe list | Demo system (`*.demo.svelte`, `/demo` routes) |
| `src/stores/recipeStores.js`, `statusStore.js` | Recipe view: multiplier, ingredient highlighting | Admin, ManageDB pages |
| `src/data/requests`, `src/data/local`, `recipeData.js`, `remoteRecipeData.js` | Recipe editor | Chrome extension build (source parked) |
| `src/data/functions/*` (the API) | Account: API tokens | Shopping list UI (later; see below) |
| `src/common/RecDef.js`, `recDisplay/rec/colors.js` | A handful of domain inputs: amount, ingredient line, duration, category | Rollup, Babel, Jest, SCSS, `faunadb` and friends |

How the two features Tom named work today, so the rebuild keeps them:

- **Multiplier.** `Recipe.svelte` puts a `multiplier` store in context; amount
  displays read it. Trivial to carry over as component state.
- **Ingredient highlighting.** `utils/ingredientUtils.js` does the real work:
  `parseIngredients(text, ingredientList)` marks ingredient mentions in the
  instruction text and `highlightItem(ing)` marks the ingredient line. The
  components (`IngHighlight`, `Ingredient`) only share a
  `{highlighted, hover, active}` store so hovering or clicking either side
  lights up and scrolls to the other. The logic is kept; the two small
  components are rewritten.

## Still first: three fixes on the running app

Unchanged from the first pass, because the old app stays live during the rebuild
and the MCP talks to it.

1. **Auth bypass in the function (verify, then hotfix).** Any request with no
   Identity user and a `Referer` containing `localhost` is treated as local dev:
   the user comes from a client-supplied `localuser` header, falling back to a
   hard-coded fake user with Tom's email. Not gated on a dev build.
2. **Every Netlify build uses the production database** (`!ROLLUP_WATCH` picks
   `Gourmet`). Decided 2026-11-16: that stays, on purpose, for the rebuild and
   local dev too, so the new app is built against real recipes. The safety net
   is backups (P0-8), tests that cannot reach the database, and the rules in
   `/AGENTS.md`, not a separate database. It makes item 1 more urgent:
   `Gourmet` holds 222 other people's recipes.
3. **The 400 path echoes `user` and request params** back to the caller.

## How the old app keeps running

```
master     the old app, in production (www). Same code as dev as of
           2026-11-16 (413dfa1), REST API included. Hotfixes only.
dev        the new app (dev.gourmetrecipemanager.com), same database. The
           MCP talks to this deploy.
rb/<id>    one branch per task, from dev, PR into dev.
```

Changed 2026-11-16: there is no separate `rebuild` branch. Tom develops and
uses the MCP against `dev`; `master` now has the same API, so the MCP can be
pointed at www if `dev` is unsettled.

- P0 cards land on `dev` first, while it is still the old app. When P0 is
  done, tag `pre-rebuild` and fast-forward `master` to `dev` once more, so
  production gets the security fixes. Then R0 starts.
- R0-1 moves the old UI source to `legacy/` (reference only, not compiled)
  and keeps the logic and function in place. Old and new never have to
  compile together.
- From R0 on, `dev` has no working UI until R0-8, but its function and REST
  API keep working at every commit: P0-5's contract tests gate every PR.
- After R0 starts, a fix the old app needs branches from `master` and merges
  to `master`; if it touches kept logic or the function, the same change also
  goes to `dev`.
- IndexedDB is per origin, so www and dev each have their own local cache.
- **Cutover:** merge `dev` into `master`. Rollback is republishing the
  previous production deploy in Netlify.

## Phases

| # | Phase | Lands on | Outcome |
| --- | --- | --- | --- |
| P0 | Safety net | `dev` | Bypass closed, one database named on purpose, backups, cache fix, REST contract tests |
| R0 | Foundation | `dev` | Vite + Svelte 5 + Contain + Vitest; logic tests green; function built by Netlify; theme; auth module; app shell you can sign in to |
| R1 | Recipe list | `dev` | Search, filter, sort, open. Card vs data list decided from a real spike |
| R2 | Recipe view | `dev` | Read a recipe, scale it, highlighting both ways, timers, usable on a phone at the counter |
| R3 | Recipe editor | `dev` | Create and edit with groups; save/revert state under test; image upload |
| R4 | Account | `dev` | API tokens; name; linked accounts |
| R5 | Multiple measures | `dev` + API | Grams and cups on one ingredient; additive to the API |
| R6 | Cutover | `master` (prod) | You use the new app daily; MCP unaffected |
| Later | — | — | Shopping list + MCP + family sharing, import/export UI, share links, extension |

The new app is usable for reading recipes at the end of R2, which is the point
to start using it day to day alongside the old one.

## Design notes

- **Auth.** One `src/auth` module owns the session. The Identity client is the
  only source of truth; `getToken()` returns a fresh JWT per request; a 401
  triggers one refresh-and-retry, then a visible signed-out state. This is the
  fix for the login oddities (the old app copies the token once and never
  refreshes it). Use `@netlify/identity`; Netlify reversed the Identity
  deprecation in February 2026.
- **Stores and sync are reused, not redesigned.** If `recipeStores.js` proves
  awkward from runes components, wrap it; do not rewrite sync in this effort.
- **Routing.** Keep `page.js` and the existing URL shapes (`/rec/:id`,
  `/main/...`) so bookmarks survive.
- **Recipe colour.** `colors.js` already returns `{bg, fg}` per recipe. In
  Contain that is a role set on the recipe's surface, read by everything inside.
- **List vs cards (R1).** Build both against real data in one sitting, a
  `DataList`/`Table` view and a `Card` grid, and pick. Possibly both, with a toggle.
- **Rich text.** Instruction bodies are stored as HTML and Quill 1.x is the
  current editor. Decide in R3: a minimal editor that preserves existing HTML,
  not a Quill port by default.
- **Multiple measures (R5)** is a data-model change, so it is its own slice
  with a short design note first. Constraint: additive only. The existing
  `amount` stays the primary measure; alternates are a new optional field that
  older clients and the current MCP can ignore. The multiplier scales all of
  them; the parser learns "240 g (2 cups) flour"; `RECIPE_SHAPE`,
  `openapi.yaml` and the contract tests gain the new field in the same PR.
- **Contain gaps** found along the way go in the gap log and get fixed in
  Contain. That is half the point of doing it this way.

## Who does what

| Tier | Use for |
| --- | --- |
| Top model with Tom | P0 fixes, R0 foundation and auth, the first screen of R1, the editor's state model (R3), the R5 design note |
| Mid model (`sonnet`) | Behaviour specs from legacy code, contract tests, building a screen from a spec, verification |
| Small model (`haiku`) | Moving files, dependency removal, porting test config, mechanical cleanup |

Each screen goes: `legacy-reader` writes a short behaviour spec from the old
code -> Tom strikes what he does not want -> `screen-builder` builds from the
spec -> `verifier` checks it.

## Open decisions

1. Confirm which branch serves the prod domain and whether previews are on (P0-1).
2. `INVENTORY.md` has a default keep / later / cut for every old feature. Edit it.
3. Decided 2026-11-16: linked accounts are in use and stay (R4-3); timers
   (R2-5) and image upload (R3-7) are in scope too.
