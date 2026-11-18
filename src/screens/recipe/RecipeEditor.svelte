<script>
  // One open recipe in edit mode, in place of the view: the same two panes
  // (ingredients on the left, everything else on the right; one column on a
  // phone), with Save, Revert, Cancel and Delete above.
  import { Bar, Button, Inline, SplitPane, Text } from "contain-css-svelte";
  import IngredientsEditor from "./edit/IngredientsEditor.svelte";
  import DetailsEditor from "./edit/DetailsEditor.svelte";
  import TextEditor from "./edit/TextEditor.svelte";
  import { ask } from "../../app/confirm.svelte.js";
  import { recipeRole } from "../../app/lib.js";

  /** @type {{ edit: import("../../app/editState.svelte.js").RecipeEdit, color: {bg: string, fg: string}, suggestions?: string[], onsaved: (row: object) => void, onclose: () => void, ondeleted: (row: object) => void }} */
  let { edit, color, suggestions = [], onsaved, onclose, ondeleted } = $props();
  let width = $state(1000);
  const wide = $derived(width >= 720);

  const FIELD_NAMES = { title: "title", categories: "categories", rating: "rating", yields: "yields", times: "times",
    sources: "sources", ingredients: "ingredients", text: "text" };
  const what = $derived(edit.changed.map((f) => FIELD_NAMES[f] ?? f).join(", "));

  async function save() {
    const saved = await edit.save();
    if (saved && !edit.dirty) onsaved?.(saved);
  }
  async function revert() {
    if (edit.dirty && !(await ask({ title: "Undo all changes?", body: `Your changes to ${what} will be lost.`, yes: "Undo changes", danger: true }))) return;
    edit.revert();
  }
  async function cancel() {
    if (edit.dirty && !(await ask({ title: "Stop editing without saving?", body: `Your changes to ${what} will be lost.`, yes: "Discard changes", no: "Keep editing", danger: true }))) return;
    onclose?.();
  }
  async function remove() {
    const title = edit.original.title || "this recipe";
    if (!(await ask({ title: `Delete ${title}?`, body: "It goes from your recipe list on every device.", yes: "Delete", danger: true }))) return;
    if (await edit.remove()) ondeleted?.(edit.original);
  }
  function onkeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
  }
</script>

{#snippet actions()}
  <Bar>
    <h2>{edit.isNew ? "New recipe" : "Editing"}</h2>
    <Inline wrap>
      {#if edit.status === "saving"}<Text muted>Saving…</Text>
      {:else if edit.status === "error"}<Text warning role="alert">Not saved: {edit.error}</Text>
      {:else if edit.dirty}<Text muted>Unsaved changes</Text>{/if}
      <Button primary onclick={save} disabled={edit.status === "saving" || !edit.dirty}>
        {edit.status === "error" ? "Try again" : "Save"}
      </Button>
      <Button onclick={revert} disabled={!edit.dirty}>Revert</Button>
      <Button onclick={cancel}>Cancel</Button>
      {#if !edit.isNew}<Button danger onclick={remove}>Delete</Button>{/if}
    </Inline>
  </Bar>
{/snippet}

{#snippet ingredients()}
  <header class="pane-head"><h2>Ingredients</h2></header>
  <IngredientsEditor {edit} />
{/snippet}

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="recipe-view recipe-editor" class:wide bind:clientWidth={width} style={recipeRole(color)} {onkeydown}>
  {#if wide}
    <SplitPane leftWidth="24rem" height="100%" resizerLabel="Resize the ingredients" resizeBehavior="preserve-left">
      {#snippet left()}
        <section class="pane ingredients-pane" aria-label="Ingredients">{@render ingredients()}</section>
      {/snippet}
      {#snippet right()}
        <div class="pane text-pane">
          {@render actions()}
          <DetailsEditor {edit} {suggestions} />
          <TextEditor {edit} />
        </div>
      {/snippet}
    </SplitPane>
  {:else}
    <div class="pane column">
      {@render actions()}
      <DetailsEditor {edit} {suggestions} />
      <section class="ingredients-inline" aria-label="Ingredients">{@render ingredients()}</section>
      <TextEditor {edit} />
    </div>
  {/if}
</div>
