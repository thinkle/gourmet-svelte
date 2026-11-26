# Feature inventory

Everything the old app does, from its routes and screens, with a default
decision. **Tom: edit the Decision column.** `keep` = in the rebuild,
`later` = server support stays, UI comes after cutover, `cut` = gone.
The `legacy-reader` agent adds detail rows under each screen as it writes specs.

| Area | Feature | Decision | Slice | Notes |
| --- | --- | --- | --- | --- |
| Session | Sign in / out, token refresh | keep | R0 | Rebuilt as `src/auth` |
| Session | New-user agreement | keep | R0 | One screen; needed for any new account |
| List | Search, category filter, sort | keep | R1 | "Fix sorting in Firefox" is on the old TODO; retest |
| List | Infinite scroll | keep | R1 | Or paging; whichever Contain makes easy |
| List | Recipe cards with per-recipe colour | decide in R1 | R1 | Card grid vs data list spike |
| List | Multi-select + bulk actions | later | | Old checkboxes fed shopping list and export |
| View | Title, properties, ingredients, text blocks | keep | R2 | |
| View | **Multiplier** | keep | R2 | |
| View | **Ingredient highlighting, both directions, with scroll** | keep | R2 | Logic in `utils/ingredientUtils.js` |
| View | Ingredient groups | keep | R2 | MCP writes these |
| View | Images (display) | keep | R2 | |
| View | Clickable times that start a timer | keep | R2 | `TimeLink`, `Timer`; logic kept in `utils/timerDrawer.js`, `utils/times.js` |
| View | Several recipes open at once (tabs), remembered per browser tab with explicit bookmark links | keep | R2-7 | Owner request, 2026-11-25/26; sessionStorage keeps normal URLs short; bookmark links use stable IDs |
| View | Linked sub-recipes | keep | R2-9 | Owner approved 2026-11-26: underlined ingredient controls open the target tab; shopping follows chains and skips cycles |
| View | Print styles | keep | R2 | Cheap with Contain; check one recipe prints on a page |
| Edit | All fields incl. groups, reorder ingredients | keep | R3 | |
| Edit | Save / revert state | keep | R3 | Test first: this is what kept breaking |
| Edit | Rich text bodies | keep, simplified | R3 | Must not damage existing HTML |
| Edit | Image upload and resize | keep | R3 | Old code: `widgets/inputs/ImageEntry.svelte` with `pica`. REST responses omit image data: check a REST update cannot drop stored images |
| Edit | Copy recipe | later | | |
| Edit | Delete / undelete | keep | R3 | |
| Edit | **Multiple measures per ingredient** | keep (new) | R5 | |
| Sync | Local cache + background sync, manual cloud sync | keep | R0 / R2-7 | Kept sync reused as is; in-app Sync recipes button |
| Account | API tokens | keep | R4 | The MCP depends on these |
| Account | Change name | keep | R4 | |
| Account | Linked accounts / invites | keep | R4 | In use (family). Server side unchanged |
| Share | Public share link `/share/:id` | later | | Server handlers stay |
| Data | Import / export file UI | later | | Server handlers stay; take a `mongodump` instead (P0-4) |
| Shopping | Shopping list | keep | S | Back in scope (owner, 2026-11-17). To buy by store aisle with checkboxes and in-place crossing off, "Done shopping" resets the trip; Pantry Items are remembered off-list. Original ingredient notes are expandable; rename/merge aliases stay separate from recipe wording. See `specs/shopping-list.md`. MCP list read, add/remove item or recipe, and bulk categorization approved 2026-11-25 (S-7); see `specs/shopping-mcp.md`. New family-sharing setup remains later |
| Nutrition | Ingredient-to-nutrition-database mapping and its UI | cut | | Superseded: an AI client can do the mapping. Server handlers left alone until after cutover |
| Extension | Chrome importer + `/sidebar` | cut from build | | MV2; source kept in `legacy/` |
| Dev | Demo pages, Admin, ManageDB, fake-user switcher | cut | | |
| Static | Support, Promo pages | cut | | |
