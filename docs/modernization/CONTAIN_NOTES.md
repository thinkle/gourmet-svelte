# Contain notes for the Gourmet rebuild

Contain's usage guide is `AGENTS-EXTERNAL.md` in the `contain-css-svelte`
package. Read it before building any screen. Its first rule is the rule here:
the right component, plain HTML inside it, and looks fixed in the theme rather
than on individual elements.

## Theme

Old Gourmet variables (from `legacy/src/webapp/App.svelte`) and a first-pass
home for each in `src/theme/gourmet.css`. Guesses until R0-6 confirms them.

| Old | Contain | |
| --- | --- | --- |
| `--white` / `--black` | `--bg` / `--fg` | |
| `--light-bg`, `--medium-bg` | surface ladder | Let the ladder derive tiers; pin only what looks wrong |
| `--accent-bg` / `--accent-fg` | a role set per recipe | `getColor(rec)` returns `{bg, fg}` |
| `--note-bg` / `--note-fg` | app-defined role | Also the highlight colour for ingredients |
| `--link` | `--on-<family>-link-text-fg` | |
| `--uiFont`, `--recipeFont`, `--brandFont` | `--font-family` + heading vars | Serif (Lora) scoped to the recipe surface |
| `--inputBorder*`, `--inputRadius` | `--field-*` | Old inputs were underline style: `vars/underline-fields.css` |

Per-recipe colour: set the role's variables on the recipe's outer surface
(`surfaceVars(role, prefix)` or `<Surface>`), never by painting backgrounds on
inner elements, so text and controls inside know what they sit on.

### Recipe color chain (R2-8)

`recipeRole()` supplies the filled `--recipe-bg/-fg` pair, a decorative
`--recipe-accent`, and `--recipe-color` as a **mixing ingredient**. On
`.recipe-view`, the theme maps these to `--primary-bg/-fg/-color` and sets
`--primary-text-amount: 35%`. A neutral `<Surface>` computes the primary text
foreground against the reading surface. Nested surfaces recompute it, so a
light recipe palette never becomes pale text pasted onto light paper.

Use `<Text primary>` for scaled ingredients and rating stars. Raw `<amount>`
in instruction HTML uses the public `--primary-text-fg` shortcut. The changed
multiplier supplies that tone through `--input-fg` on its wrapper. Filled
recipe bands keep the recipe family's paired ink; highlights use the note
family and its `--on-note-primary-text-fg` pin. Instruction highlights are raw
HTML, so they use the note pair directly and nested amounts inherit its ink.
Do not set a text color to `--recipe-bg` or `--recipe-color`.

The published package still omits the guide; for this task the full guide and
`docs/color-families.md` were read from the sibling `contain-css-svelte` source.

## Component choices

Record decisions here as slices land, so later screens match.

| Need | Use | Decided in |
| --- | --- | --- |
| App frame | `Page` + `Bar` | R0-8 |
| Recipe list | `DataList` / `Table` or `Card` grid | R1-2 |
| Ingredients beside text | `SplitPane` or `Columns` by container query | R2-4 |
| Category chips | `Tag` | |
| Dialogs (delete confirm, token shown once) | `Dialog` | |
| Form rows in the editor | `FormProvider layout="above"`, `FormItem` (one input), `Fieldset` (rows), `Input`, `CircleButton` for row tools | R3 |
| Confirm (revert, discard, delete) | `Dialog` via `ConfirmHost` + `ask()` | R3 |
| Multiplier | `Input` type number or `GroupedToggle` presets (½, 1, 2, 3) | R2-2 |

## Gap log

Things Gourmet needs that Contain lacks. Fix in Contain; do not build local
substitutes.

| Need | Seen in | Contain issue | Meanwhile |
| --- | --- | --- | --- |
| `AGENTS-EXTERNAL.md` (which AGENTS.md says to read first) is not in the published `contain-css-svelte` 1.10.1 package, so the Tab Navigation and field variables could only be learned from `dist/vars/*.css` and `TabBar.svelte`. Ship it in `files`. | Sliding tab underline task | Packaging | Read the CSS in `node_modules/contain-css-svelte/dist/vars/`. |
| The sliding indicator replaces the active tab's own underline, so a "thin rule under every tab, thick coloured one under the active tab" look needs the owner's workaround: `.tab-indicator-live { --tab-active-border-bottom: var(--tab-border-bottom) }` in `gourmet.css`. A variable such as `--tab-indicator-keep-rule` (or having the live state fall back to `--tab-border-bottom`) would make this a one-liner. | Sliding tab underline task | TabBar / underlined-tabs preset | The override above. |
| **Fixed in contain-css-svelte 1.10.2.** `Dialog` `dismissible` treated any click reaching the dialog with coordinates outside its content box as a backdrop click. A keyboard-made click (Enter/Space on a button inside) and a scripted `el.click()` both carry clientX/Y 0, so the dialog closes and reports a dismissal instead of doing the button's work. Hit-testing the event's target against the content box, or ignoring a click whose target is inside it, would fix it. | R3 confirm dialogs (`ConfirmHost.svelte`); the add-a-photo dialog, where `fileInput.click()` from a button inside dismissed the dialog and took the file input with it, so a chosen photo was silently lost | thinkle/svelte-contain-css#41 | Fixed upstream: a backdrop click must now target the dialog itself. `ConfirmHost` stays non-dismissible by choice. The photo file input stays outside its dialog, which is what makes a chosen photo survive any dismissal, including a backdrop tap on a phone. |
| No combobox / autocomplete input | R3 categories | to file | `Input` with a native `<datalist>` |
| No rich-text / contenteditable surface | R3-5 text bodies | to file | Plain `contenteditable` styled in `gourmet.css` |
| Rich Select options show SVG icons on desktop, but Select switches to a native text-only control below 600px; there is no rich mobile option mode. | Shopping aisle picker | Select | Retain labeled native mobile options; desktop menu and selected value show the aisle icons. |
| Dialog reserves a separate close-bar row; there is no header/close layout option for a compact form whose first label should align with the close button. | Shopping-item editor | Dialog | Scope absolute positioning of the existing close bar to `.shopping-item-dialog` in the theme and reserve space beside its first label. |
| Nothing in Contain prints. `Page`, `Container` and `DataList` set `container-type` (and `Page`/`DataList` also clip their overflow), and a box with either is monolithic to a printing browser: it is not broken at a page boundary but sliced through, mid-line. A `media="print"` preset, or a documented `container-type: normal` escape, would save every app the same discovery. | Ctrl+P on a recipe and on the shopping list | to file | `src/theme/print.css` turns off `container-type` and `overflow` for the printed tab, unwinds the scrolling panes and sets ink-on-paper colours. |
