# Should a recipe get to choose its own colours?

Owner asked on 2026-11-27: "Consider whether custom color support is a
horrible idea or a good one. On the plus side, it would be fun to customize,
and especially with agents writing recipes, they could potentially do a nice
job picking theme colors. On the other hand, allowing users to pick colors
could be a disaster in terms of one recipe clashing with the next."

**Verdict: good idea, in one specific form. Let a recipe *name* a palette;
never let it name a colour.** Built on `dev` on 2026-11-27.

## What the worry is really about

Both halves of the question are right, and they are about different things.

A free colour picker would be a disaster here, and not mainly because of
taste. The recipe palette is not decoration bolted on the side: R2-8 made it a
Contain role. The app derives a tint for scaled amounts (35%), an ink pin for
highlighted amounts, link and heading colours, and the colours of a filled
band, **from that one pair**. The 71 palettes were drawn as pairs and measured
together — the worst contrast in the set is 4.82:1 for tints and 12.12:1 for
highlights. Hand `#ff00ff` on `#ff66cc` to the same machinery and every one of
those derived tones is wrong at once, and the recipe view is unreadable rather
than merely ugly. We would then need contrast checking, clamping, and a way to
tell a user their colour was quietly changed — a lot of machinery to make a
bad idea survivable.

The clash worry is real too, but it is smaller than it looks, because **it
already exists**: a list of recipes already shows a Halloween black next to a
salmon pink next to a Christmas green, and it looks fine. The swatches are
small, each card is the same shape, and nothing in the chrome changes. Letting
someone choose *among those same palettes* adds no clash that today's
automatic matcher cannot already produce.

## So: named palettes

A recipe may carry `palette: "christmas"`. The names come from the palettes'
own matchers ("chocolate", "pumpkin", "ocean", "japanese", "house"), so there
is nothing new to curate and nothing to drift out of sync with
`src/common/colors.js`, which stays untouched. Leave it out and nothing
changes: the automatic choice runs as before.

What this buys:

- **The automatic guess misses sometimes, and now it can be corrected.** A
  Yule log that never says "Christmas" is a plain chocolate brown. A recipe
  called "Supper" gets the house palette. Both are one dropdown away from
  right.
- **Agents can be tasteful on purpose.** This was the owner's instinct and it
  is the strongest argument. An agent writing a recipe is already choosing a
  title, categories and the words of the instructions; choosing "the harissa
  one" is the same kind of judgement, and `GET /recipes/palettes` gives it the
  whole vocabulary with the colours attached. It cannot invent an unreadable
  pair, because there is no syntax for one.
- **It is reversible and cheap.** One optional string; "" goes back to
  automatic. Nothing else in the recipe changes.

What it deliberately does not buy: per-recipe fonts, per-recipe chrome, or
free colours. If someone really wants a colour the set does not have, the
answer is to add a designed palette to `colors.js` — which also gives it a
name, a matcher, and a measured pair — not to open the door to hex.

## How it is wired

| Where | What |
| --- | --- |
| `src/app/palettes.js` | names derived from each matcher (a short rename map where the first word reads badly), the list, and `paletteFor(recipe)` |
| `src/app/lib.js` | `prepare()` uses `paletteFor` instead of `getColor`, so list rows, tab chips, swatches and the recipe view all follow |
| `src/components/PaletteChooser.svelte` | the editor control: a swatch and a dropdown headed "Automatic (carrot)" |
| REST API | `palette` accepted and returned; validated against the names (a 400 names the endpoint to look at); `GET /recipes/palettes` lists them; documented in OpenAPI and `/recipes/schema` |

`src/common/colors.js` is kept logic and is not edited: the names are derived
from it, which also means a palette added there gets a name for free.

## If it turns out to be a mistake

The field is optional and ignorable. Dropping the feature means deleting the
chooser and the one line in `prepare()`; recipes carrying a `palette` would
simply go back to their automatic colours. Nothing migrates, nothing breaks.

## Worth watching

- Whether agents overuse it. A recipe that names a palette stops tracking its
  own content, which is a small loss. The tool description should say "when
  the automatic choice misses", not "always pick one".
- Whether "Automatic (carrot)" reads clearly enough that people understand the
  default is doing something, rather than thinking the recipe has no colour.
