# S-7: Shopping-list commands for MCP clients

Owner requested 2026-11-25: add/remove a loose item, add/remove a recipe, and
categorize one or more items. Build this separately from S-6 live shopping.
The owner confirmed a database dump earlier in this session, before these
backend writes. No deployed data is used by automated tests.

The API will expose an additive `/shopping-list` resource, authenticated with
existing recipe read/write token scopes. Read returns the app's merged list,
canonical item keys, source recipes and aisle choices. Commands operate on a
selected list by `_id`, or choose the same default as the app when omitted.
Only a first add creates a missing list; reads never write.

Keep all existing `/recipes/*` request/response/update semantics unchanged.
Use the Netlify entrypoint to route the new resource; import kept logic without
editing it. Use conditional writes of the specific shopping fields rather than
replacing the whole recipe document. Preserve cart, pantry, image and live-sync
metadata. Update `last_modified` and `last_remote_save` for browser cache sync.

The actual MCP tool registrations live outside this repository; their location
has been requested from the owner. API/OpenAPI and contract tests can proceed
independently; do not report the connected MCP as updated until registrations
are implemented and verified there.

## HTTP and MCP integration

All paths are below `/.netlify/functions/api`, use the existing Bearer token,
and return the current `ShoppingListResponse` after each successful command.

| Suggested MCP tool | Method and path | Arguments |
| --- | --- | --- |
| `get_shopping_list` | `GET /shopping-list` | optional `listId` query |
| `add_shopping_item` | `POST /shopping-list/items/add` | `text`, optional `listId` |
| `add_recipe_to_shopping_list` | `POST /shopping-list/recipes/add` | `recipeId`, optional `multiplier` (default 1), `listId` |
| `remove_shopping_item` | `POST /shopping-list/items/remove` | exact canonical `key`, optional `listId` |
| `remove_recipe_from_shopping_list` | `POST /shopping-list/recipes/remove` | `recipeId`, optional `listId` |
| `categorize_shopping_items` | `POST /shopping-list/items/categorize` | `keys` (1–100), `category` (string or null), optional `listId` |

Reads need `recipes:read`; writes need `recipes:write`. Token revocation and
existing linked-account Identity sessions are respected. Account/owner fields
from clients never grant access. Responses are no-store and omit images and
internal live metadata. Errors have `{error: string}` and appropriate 400, 401,
403, 404, 405, 409 or 500 status. Unexpected backend errors are redacted.

Read first for exact item keys, including aliases and plurals. An omitted
listId uses `chooseList` (most entries, then newest). GET returns listId null
when no list exists, without creating data. Only the first add may create a
list; simultaneous first adds converge on a deterministic account-specific id.
A deliberately deleted deterministic default is not revived automatically.

Loose text uses the kept ingredient parser. Recipe adds store references and
multipliers rather than copying ingredients; repeated adds sum multipliers.
Do not blindly retry an add after an uncertain response; read the list first.
Recipes must belong to the effective account, be live, and not themselves be
shopping lists. Nested recipe references share the app's traversal, with stable
server ids substituted for device-local numeric ids in the read model.

Remove item deletes matching loose entries and records the canonical key in
the new optional `excludedItems` array. The shared app view hides that key after
alias resolution, including recipe contributions. Source recipes and pantry
preferences stay unchanged. A loose add with that key removes its exclusion.
An exclusion persists on this list until explicitly restored; Done shopping
continues to reset only cart/trip. Recipe removal only removes the reference.

Categories are shopping aisles, not recipe categories. Assignment accepts one
or many canonical keys and a default/custom name; null clears explicit choices.
All keys must be present before any assignments are saved. No fuzzy matching.

Writes conditionally match ingredients, aliases, exclusions and aisles before
updating only changed fields and server timestamps. Conflicts re-read and retry
up to eight times, then return 409. This retains concurrent additions and
unique local entry ids, and preserves simultaneous cart changes. Pantry, images,
source recipes and optional live-shopping metadata are never replaced.

No polling is introduced. The browser sees changes on its next recipe sync,
or the separate S-6 live poll when present. Existing offline whole-document
saves and old clients retain their existing conflict limitations; these new
commands do not redesign the kept general sync layer.

## Verification and owner trial

API contracts use an in-memory MongoDB and minted test tokens; no real database
or deployed shopping list is touched. Cover token scopes/revocation, owner and
linked account isolation, discovery, missing/default lists, all commands,
invalid input, atomic bulk assignment, concurrent adds/cart edits, canonical
aliases, nested recipes and preservation of unrelated fields. App tests cover
exclusions of merged loose/recipe items and aliases without source mutation.

Once the separate MCP tool definitions are connected and deployed by the owner:
read the list, add a scratch loose item, assign a category to it, and remove it.
Add an existing recipe at a multiplier, confirm totals, remove its reference,
and confirm the source recipe is untouched. Use a scratch shopping list when
possible and remove it afterwards. Never test by modifying someone else's list.

Verified locally: build and standalone Netlify function bundle passed; 179 API
tests passed (145 existing plus 34 shopping contracts, 2 existing skips); 169
app tests passed (166 existing plus 3 exclusions). OpenAPI parses with six new
shopping paths and all 58 references resolved. A sandbox build initially could
not write `dist` in this managed worktree (`EPERM`); rerunning with worktree
write permission passed. Existing bundle-size, Mongo-driver and Jest
open-handle warnings remain unchanged. Verification made no real-database writes.
Tool registrations and their end-to-end MCP trial remain pending.
