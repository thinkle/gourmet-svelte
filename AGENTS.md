# Agent instructions: gourmet-svelte

Gourmet is a recipe manager: Svelte SPA, one Netlify function, MongoDB, a Dexie
(IndexedDB) local cache that syncs to the server. The UI is being rebuilt from
scratch on Svelte 5 + Contain while the logic and API are kept. Read
`docs/modernization/PLAN.md` for the why, `INVENTORY.md` for scope, and
`TASKS.md` for what to do next. Work one task card at a time.

## Hard rules

1. **The REST API is a contract.** Paths under `/.netlify/functions/api/recipes/*`
   and the shapes in `public/openapi.yaml` are used by an MCP server in daily
   use. Do not change request or response shapes, status codes or update
   semantics unless the card says to, and then only additively. Never edit an
   existing contract test to make it pass.
2. **Never touch real data.** Local and branch builds use the `devtest`
   database. Do not set, hard-code or default `MONGO_DB_NAME` to `Gourmet`. Do
   not run scripts against a remote database. Do not print or commit `MONGO_*`
   values or API tokens.
3. **Branches.** Never commit to `master` or `dev`. Task work goes on
   `rb/<task-id>-short-name` and merges by pull request into `rebuild` (`dev`
   only for P0 cards). Do not push, merge or deploy unless asked.
4. **One task, one PR.** Stay inside what the card names. If the task needs a
   change elsewhere, stop and report it.
5. **`legacy/` is reference only.** It is the old UI. Never edit it, never
   import from it, never copy its markup or CSS into new code. Only the
   `legacy-reader` agent reads it, to write behaviour specs.
6. **Kept logic is not yours to change.** `src/utils`, `src/importer`,
   `src/stores`, `src/data`, `src/common` are reused as they are. Import them.
   If one looks wrong, report it; do not patch or reimplement it.
7. **Build only what is in scope.** `INVENTORY.md` decides. `later` and `cut`
   features are not built, however small.
8. **Do not delete tests.**
9. Files ending in `~` or wrapped in `#…#` are editor backups. Ignore them.

## Layout (on `rebuild`)

```
src/app/            shell, routes
src/screens/        one folder per screen
src/components/     Gourmet-specific pieces: amount, ingredient line, inputs
src/auth/           session: the only place that talks to Netlify Identity
src/theme/          gourmet.css: Contain variables for this app
src/stores/         kept: recipes (local + remote), status, user
src/data/           kept: requests, Dexie, sync
src/utils/, src/importer/, src/common/   kept: parsing, units, times, RecDef
netlify/functions/  the API
legacy/             old UI source, reference only
docs/modernization/ plan, inventory, tasks, specs, Contain notes
```

## UI

Svelte 5 runes for components; stores stay `svelte/store`. UI is built with
Contain (`contain-css-svelte`): read `AGENTS-EXTERNAL.md` in that package
first. The right component with plain HTML inside; fix looks in
`src/theme/gourmet.css`; no utility-class CSS; no per-element decoration. If
Contain lacks something, log it in the gap log in `CONTAIN_NOTES.md`.

## Checks

Run and paste the tail of each before reporting done: `npm run check`,
`npm test -- --run`, `npm run build`. (On `dev`, for P0 cards: `npm run build`
and `npm run test-one`.) If a check was failing before your change, show
before and after.

## Reporting

End every task with: what changed, what you verified and how, what you were
unsure about, what you noticed but did not touch.
