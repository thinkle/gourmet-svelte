<script>
  // The ingredient list in edit mode: lines of text, groups with a name,
  // reorder with the arrow buttons or Alt+Up / Alt+Down (a line moves into
  // and out of groups as it passes their edges). No drag yet.
  import { tick } from "svelte";
  import { Button, CircleButton, Input, Inline, Text } from "contain-css-svelte";
  import IngredientLine from "../../../components/IngredientLine.svelte";
  import { ingredientsView, moveLine, insertLine, removeLine, ungroup, findSecondUnits } from "../../../app/recipeEdit.js";

  /** @type {{ edit: import("../../../app/editState.svelte.js").RecipeEdit }} */
  let { edit } = $props();
  let box = $state();

  const view = $derived(ingredientsView(edit.draft.ingredients));
  const isGroup = (x) => Array.isArray(x?.ingredients);
  // Every change goes through the regular shape (converted on first edit).
  const list = () => edit.list("ingredients");

  async function focus(path) {
    if (!path) return;
    await tick();
    box?.querySelector(`input[data-path="${path.join(".")}"]`)?.focus();
  }
  function set(path, value) {
    const l = list();
    if (path.length === 1) l[path[0]] = value;
    else l[path[0]].ingredients[path[1]] = value;
  }
  let found = $state(null);
  function readSecondUnits() { found = findSecondUnits(list(), set); }
  const enter = (path) => focus(insertLine(list(), path));
  const remove = (path) => focus(removeLine(list(), path));
  const move = (path, dir) => focus(moveLine(list(), path, dir));
  async function addGroup() {
    const l = list();
    l.push({ text: "", ingredients: [{ text: "" }] });
    await tick();
    box?.querySelector(`input[data-group="${l.length - 1}"]`)?.focus();
  }
  function groupKey(e, g) {
    if (e.key === "Enter") { e.preventDefault(); enter([g]); }
    else if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      const to = moveLine(list(), [g], e.key === "ArrowUp" ? -1 : 1)[0];
      tick().then(() => box?.querySelector(`input[data-group="${to}"]`)?.focus());
    }
  }
</script>

{#snippet line(ing, path)}
  <li class="edit-line">
    <IngredientLine
      {ing}
      path={path.join(".")}
      onchange={(v) => set(path, v)}
      onenter={() => enter(path)}
      onremove={() => remove(path)}
      onmove={(dir) => move(path, dir)}
    />
    <span class="line-tools">
      <CircleButton aria-label="Move up" onclick={() => move(path, -1)}>↑</CircleButton>
      <CircleButton aria-label="Move down" onclick={() => move(path, 1)}>↓</CircleButton>
      <CircleButton aria-label="Remove line" onclick={() => remove(path)}>×</CircleButton>
    </span>
  </li>
{/snippet}

<div class="ingredients-editor" bind:this={box}>
  <ul>
    {#each view as ing, i}
      {#if isGroup(ing)}
        <li class="edit-group">
          <span class="group-head">
            <Input value={ing.text ?? ""} placeholder="Group name, e.g. For the glaze" aria-label="Group name"
              data-group={i} oninput={(e) => (list()[i].text = e.currentTarget.value)} onkeydown={(e) => groupKey(e, i)} />
            <span class="line-tools">
              <CircleButton aria-label="Move group up" onclick={() => moveLine(list(), [i], -1)}>↑</CircleButton>
              <CircleButton aria-label="Move group down" onclick={() => moveLine(list(), [i], 1)}>↓</CircleButton>
              <CircleButton aria-label="Remove group, keep its lines" title="Remove group (its lines stay)" onclick={() => ungroup(list(), i)}>×</CircleButton>
            </span>
          </span>
          <ul>
            {#each ing.ingredients as sub, j}{@render line(sub, [i, j])}{/each}
          </ul>
          <Button onclick={() => enter([i, ing.ingredients.length - 1].filter((n) => n >= 0))}>Add line to {ing.text || "group"}</Button>
        </li>
      {:else}
        {@render line(ing, [i])}
      {/if}
    {/each}
  </ul>
  {#if !view.length}<p><Text muted>No ingredients yet.</Text></p>{/if}
  <Inline wrap>
    <Button onclick={() => enter(null)}>Add line</Button>
    <Button onclick={addGroup}>Add group</Button>
    <Button onclick={readSecondUnits} title="Look through the lines for a second measure written in the text, like (2 sticks) or (113 g), and give it its own place">Find second units</Button>
    {#if found !== null}<Text muted>{found ? `Found ${found}. Save to keep them.` : "None to find."}</Text>{/if}
  </Inline>
  <p class="hint"><Text muted>Type a line the way you'd write it. Enter adds the next; Alt+↑/↓ moves a line, in and out of groups.</Text></p>
</div>
