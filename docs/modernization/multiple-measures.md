# Multiple measures per ingredient (R5)

One ingredient carries more than one measure: "2 sticks (225 g) butter", both
shown, both scaled. Status: R5-1 to R5-4 built on `rb/r5-multiple-measures`;
R5-5 (MCP worker) is another repository.

## Open decisions for Tom

1. **Strip the measure from the text, or keep it there too?** Built: strip
   (the text is the name only, as it already is for `amount`), and keep the
   line as written in `originalText`. Risk: the old editor on `master`
   rebuilds a line from `amount` + `text` when you edit it, so editing a line
   there drops `altAmounts` (untouched lines are not rewritten, as far as I
   read it). Safe route: do not run any maintenance pass until `dev` is
   `master` (R6-3).
2. **Which measure is primary?** Built: whichever was written first or sent as
   `amount`; the parenthetical is the alternate. Real data is mixed (some lines
   are 285 g + "(2 1/2 sticks)", some 1 cup + "(113 g)"), and the display
   keeps that order. Not built: a per-user "show grams first" toggle or swap.
3. **Rounding.** Scaled g/ml are rounded (below). Say if you would rather
   they scale unrounded.
4. **"About" measures** ("(about 2 cups)") are not parsed; they stay in the
   text. Parsing them would need an `approximate` flag.
5. **Re-parse stored recipes?** Dry run only, see the end. Needs your yes.

## Stored shape (additive)

`altAmounts` beside `amount` on an ingredient, optional, absent when empty:

```json
{ "text": "unsalted butter", "originalText": "unsalted butter (2 1/2 sticks)",
  "amount":     { "amount": 285, "unit": "g", "standardUnit": "g" },
  "altAmounts": [ { "amount": 2.5, "textAmount": "2 1/2", "unit": "sticks" } ] }
```

Each entry has the same shape as `amount` (`amount`, `rangeAmount`, `unit`,
`standardUnit`, plus `textAmount`s when parsed). An array, not one `altAmount`,
because "2 sticks (1/2 lb) (225 g)" is real and costs nothing. `alt` over
`alternate` is only brevity. Nothing existing changes; a recipe without it
comes back byte for byte as before.

## What the parser reads (`src/utils/altAmounts.js`)

A parenthetical becomes a measure only if all of it is a number or range plus
one unit that is a **mass, a volume, or a stick** (case-insensitive, so "mL"
works), it is not followed by a container word, and the primary amount is not
a container or size. Everything else is untouched.

| Input | Result |
| --- | --- |
| `240 g (2 cups) flour` | amount 240 g; alt 2 cups; text `flour` |
| `1 cup (113 g) butter, softened` | amount 1 cup; alt 113 g; `butter, softened` |
| `flour (2 cups)` | the only measure is the amount (was: text `)`) |
| `2 cups / 240 g flour` | slash after a complete measure, same as parens |
| `{amount: 285, unit: g, ingredient: "butter (2 1/2 sticks)"}` | what agents write today: text searched too |
| `2 cups flour (optional)`, `(about 3 lemons)`, `1 can (14 oz) tomatoes`, `(14 oz) can tomatoes`, `potato (1 large)` | left alone |

An explicit `altAmounts` from a client always wins and the text is not
searched; `altAmounts: []` means "none, do not look". `stick` is not a Gourmet
unit and I did not add it (that would change how "1 stick butter" parses); it
is accepted only inside an alternate and has no `standardUnit`.

## Display and scaling

Primary bold, alternates in brackets after it: `2 sticks (225 g) butter`
(`src/components/Measures.svelte`, `src/utils/formatMeasure.js`). The multiplier
applies to every measure. Household units keep natural fractions via
`formatAmount`. Grams and ml: as stored at x1; scaled, under 10 one decimal,
under 100 whole, under 1000 nearest 5, above that nearest 10 (113 g x 1 1/3 is
150 g, not 150.67). kg and litres: at most two decimals.

`standardUnit` is what a shopping list or converter should use to pick a
measure it can add up: with `altAmounts` it can take the first measure whose
`standardUnit` it understands (grams are summable, "sticks" are not).

## Old clients

The REST API only adds a field, so the MCP and `master` keep working. They see
the primary measure and a name without the parenthetical; the alternate is
invisible to them. A client that reads, edits and PUTs the whole ingredient
list without passing `altAmounts` back drops it (lists replace wholesale), so
R5-5 must pass it through. The new editor must keep it on untouched lines.

## Re-parsing stored text later

Not run. `scripts/migrate/alt-measures-dry-run.mjs <dump dir>` reads a dump
and prints counts (`--details file` writes before/after lines; keep it out of
the repo). On the 2026-11-17 dump it would change 235 of 29,802 ingredients in
128 of 3,892 recipes. An apply step needs a fresh dump, Tom running it, and
decision 1 settled.

## What the editor needs

An "also" field per ingredient line that edits `altAmounts` (amount + unit),
pre-filled from the stored list; on parse of typed text use
`parseIngredientText` from `src/utils/ingredientParsing.js`, which returns
`altAmounts` itself.
