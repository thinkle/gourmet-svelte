# R2-9 Linked recipes

Owner brought sub-recipes into scope on 2026-11-26: underlined ingredient links,
open the target recipe, and recursively include its ingredients in shopping.

A link is an ingredient object, including inside a group:

```json
{
  "text": "Apple filling",
  "reference": "target-recipe-id-from-search",
  "amount": {"amount": 0.5}
}
```

Use the target's exact REST `_id`. The label is not a lookup key. Amount is
batches: 1 means the whole target recipe, 0.5 half; absence means 1. A servings,
weight or volume amount does not convert against the target yield. Multipliers
multiply along the chain and scale leaf ingredients and ranges. Explicit zero
stays zero. No stored shape or API write-path change is needed.

Search/GET first. To update, GET the parent, edit its ingredient array, and send
the complete array back, keeping existing reference/amount/altAmounts and other
fields. Ingredients replace the entire list. A recipe name or ID in instructions
is only text and does not create a link.

The ingredient control opens/focuses the app's existing recipe tab, resolving
remote `_id` or historical local `id`. Missing targets display “recipe
unavailable” without a false link. Both the desktop list and phone sheet use the
same component. Ordinary ingredients keep their highlighting behavior.

Shopping follows groups and recipe references. Cycle detection tracks the
recipe objects on the current path, so API records with no local IDs work too.
A repeated recipe on separate branches counts each time; only circular edges
are skipped. Unavailable targets are skipped, as before. Source attribution
remains the top-level recipe on the list. Tests use synthetic records and
in-memory Mongo only.

## Live observation and MCP location

Read-only check, 2026-11-26: “Thanksgiving 2026” (`2-mwxmkn48-q3vg3f`) has names
and IDs in a menu text block but an empty ingredient array. It contains no
functional recipe links. This does not establish which earlier agent wrote
which field, and no live recipe was changed.

The account/API page supplies tokens, OpenAPI and example client instructions;
it is not the MCP implementation. Its example URLs follow the browser origin.
The worker was found locally at:

`/Users/thinkle/BackedUpProjects/gas/nutrition-tracker/cloudflare-mcp/src/index.js`

Its `wrangler.toml` sets `RECIPE_API_BASE` to
`https://dev--gourmet-svelte.netlify.app/.netlify/functions/api`. The worker source was updated on branch `codex/linked-recipe-ingredients` to
explicitly advertise `reference` in ingredient schemas and describe batch
multipliers, lookup by exact target ID, grouped links, and full-list updates.
Five mocked tests drive the actual worker MCP handler: tools/list, create,
update, mobile JSON-string ingredients, and legacy numeric/null references.
Run `node --test tests/linked-recipes.test.mjs` in `cloudflare-mcp`.

The tools exposed to this chat still advertise only string arrays. The worker was deployed at the owner's request on 2026-11-26 to
`https://personal-mcp.tmhinkle.workers.dev`, version
`b4b0de2b-7733-4082-a195-33fb818b2b87`. Five mocked MCP tests passed again
before deploy. Live checks: public OAuth metadata returned 200 and the
unauthenticated MCP endpoint returned 401. Authenticated live tools/list was
not checked because no local MCP credential was available. Reconnect clients
to refresh their tool definitions. Neither repository was pushed; the web UI
change is committed directly to local dev at owner request, with pushing and
deployment still pending. No live recipe was changed.

Keeping a recipe-specific MCP adapter here would put its schema and API tests in
one repo. Moving the whole personal worker would also move nutrition/Xert and
other unrelated integrations; leave that decision to a separate task.

## Verification

Combined-history baseline: build passed and 207 app tests passed. After this
change: build passed, 216 app tests passed, and 181 API tests passed (2 existing
skips). `npm run check` is unavailable: package.json has no check script.
The API runner initially needed permission to bind its in-memory localhost
Mongo socket. No real database was used by tests.

An isolated Chrome session replaced only the fixture-module response with
synthetic records. Verified desktop underline, keyboard activation, child/parent
navigation with existing tab reuse, shopping total of 4 kg apples from a 2×
sub-recipe including a back-cycle, and 390 px phone navigation without overflow.
The existing local fixture file was not modified. Build retains the existing
large-chunk warning.
