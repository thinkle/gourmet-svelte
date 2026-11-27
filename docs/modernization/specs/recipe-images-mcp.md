# Photos for agents: what the API offers, and what the MCP worker needs

Owner asked on 2026-11-27: "We've improved image support, but I'm not sure
about our interface for agents. It would be nice if the MCP had clear ways for
agents to provide images to go along with recipes."

The REST side of this is built (this repo, on `dev`). The MCP tool
registrations live in the separate nutrition-tracker Cloudflare worker and are
**planned here, not implemented** — the owner asked for a plan first, since
that repository has not been brought home under Gourmet yet.

## Why an agent could not do this before

A photo is stored inside the recipe, as a data URL: `images: [{url, caption}]`
(the desktop app's shape; `src/app/recipePhotos.js`). That is why the API has
always emptied `images` out of every recipe response — one photo can be
megabytes, and a search returning a hundred recipes would be unusable.

The result was that an agent could not see that a recipe *had* a photo, and
had no sanctioned way to give it one. It could put a data URL in `images` on a
write, but that means moving megabytes of base64 through a tool call, with no
size checking, and it replaces every photo already on the recipe. An https link
in `images` looked like it worked and then showed nothing, because the app only
renders `data:` URLs.

## What the API does now (built)

Everything is additive; no existing request or response shape, status code or
update semantics changed.

**Seeing photos**

| What | How |
| --- | --- |
| Does this recipe have photos? | `imageCount` on every recipe response (`images` still comes back `[]`) |
| Which recipes have none? | `GET /recipes/summary?include=imageCount`, or `include: "imageCount"` in a summary query body. Opt-in, because the summary's field set is pinned by a contract test. Only `images.width/height/caption` are projected, so the pictures are never read out of the database. |
| What are they? | `GET /recipes/{id}/images` → `{_id, imageCount, images: [{index, caption, contentType, bytes, width?, height?}]}` |
| Show me one | `GET /recipes/{id}/images/{index}` → the same, plus `url`, the picture as a data URL. The one call that returns image data, deliberately. |

**Providing photos**

| What | How |
| --- | --- |
| Create a recipe with its photo, in one call | `POST /recipes` with `imageUrls: ["https://…"]` |
| Add a photo to an existing recipe | `POST /recipes/{id}/images` with `{url}` or `{dataUrl}`, optional `caption`, optional `index` (`0` makes it the main photo), or `images: [...]` for up to 4 |
| Add one while editing something else | `imageUrls` on `POST /recipes/update` or `PATCH /recipes/{id}` |
| Caption or reorder | `PATCH /recipes/{id}/images/{index}` with `{caption}` and/or `{index}` |
| Remove | `DELETE /recipes/{id}/images/{index}` |

`url` is fetched server-side through the existing guarded downloader
(`netlify/lib/recipeImage.js`: public addresses only, DNS pinned across
redirects, 4 MB and 8 s bounded, no caller headers passed on), and the bytes
are stored. The recipe therefore keeps its photo when the original link rots,
and the agent never has to carry base64 through a tool call.

`imageUrls` is the one field on this API that **adds** rather than replaces:
on an update the fetched photos join the ones already on the recipe. That was
deliberate — the failure mode we most wanted to avoid is an agent editing a
title and silently dropping Tom's photos. Sending `images` directly still
replaces, as it always has.

Limits mirror the browser editor's, so a photo the API accepts is one the app
can still save: about 3 MB per picture, about 3.4 MB per recipe, jpeg/png/webp/
gif/avif. Over that is a 413 saying what to do. A fetch that fails fails the
whole request **before anything is written**, so a recipe is never half-saved.

Scopes are the existing ones: `recipes:read` to look, `recipes:write` to change.

## What the MCP worker needs (not built)

Suggested tools, each a thin wrapper over the paths above:

| Suggested MCP tool | Method and path | Arguments |
| --- | --- | --- |
| `list_recipe_images` | `GET /recipes/{id}/images` | `recipeId` |
| `get_recipe_image` | `GET /recipes/{id}/images/{index}` | `recipeId`, `index`. Returns image data: the tool should hand it back as an image content block where the client supports one, and should not be called speculatively. |
| `add_recipe_image` | `POST /recipes/{id}/images` | `recipeId`, `url` or `dataUrl`, optional `caption`, optional `index` |
| `update_recipe_image` | `PATCH /recipes/{id}/images/{index}` | `recipeId`, `index`, `caption` and/or new `index` |
| `remove_recipe_image` | `DELETE /recipes/{id}/images/{index}` | `recipeId`, `index` |

The existing `create_recipe` and `update_recipe` tools need **one new optional
argument** each: `imageUrls` (string or array of strings/`{url, caption}`). The
tool description should say that it adds photos and never removes any, and that
a plain https link is the cheap way in. That one argument is most of the value
here: it turns "write this recipe down" into "write this recipe down with its
photo" without a second round trip.

Also worth passing through in the worker's recipe output: `imageCount`, so an
agent can say "this one has no photo yet" without another call.

A worker that only has string arguments can still do all of this: every
endpoint takes plain strings and integers.

## Trial, once the worker is updated

Against the `dev` deploy, on a scratch recipe the agent created itself, removed
afterwards (never on one of Tom's):

1. Create a recipe with `imageUrls` pointing at a public image. Check
   `imageCount` is 1, then open the recipe in the app and look at it.
2. Add a second photo with `add_recipe_image`, caption it, move it to index 0,
   confirm the app shows the new main photo.
3. Update the recipe's title with `update_recipe` and confirm both photos
   survive.
4. Try a link that is not an image, and one that is too large: both should
   fail with a readable message and change nothing.
5. `include=imageCount` on a summary query: confirm the recipes without photos
   are findable.
6. Delete the scratch recipe.

## Open questions for Tom

- Should `get_recipe_image` exist at all? It lets an agent look at a photo
  (useful for "write a caption for this", "is this the right picture?") but
  moves megabytes. It is built and documented as deliberate; the worker can
  simply not register it.
- Server-side resizing. The browser resizes to 1200px before saving; the API
  cannot, because there is no image library in the function bundle, so a large
  picture is refused rather than shrunk. If agents start hitting that, the fix
  is a resize step in the function (a wasm encoder) or a documented habit of
  linking to an already-reasonable image.
