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
| `Dialog` `dismissible` treats a keyboard-made click (Enter/Space on a button inside, clientX/Y 0) as a backdrop click, so it closes and reports a dismissal instead of the button's action | R3 confirm dialogs (`ConfirmHost.svelte`) | to file | Confirm dialogs are not `dismissible`; Escape and the close button still dismiss |
| No combobox / autocomplete input | R3 categories | to file | `Input` with a native `<datalist>` |
| No rich-text / contenteditable surface | R3-5 text bodies | to file | Plain `contenteditable` styled in `gourmet.css` |
