<script>
  // The ingredient list in edit mode: lines of text, groups with a name,
  // reorder with the arrow buttons or Alt+Up / Alt+Down (a line moves into
  // and out of groups as it passes their edges). No drag yet.
  import { tick } from "svelte";
  import { Button, CircleButton, Input, Inline, Text } from "contain-css-svelte";
  import RecipeIngredientPicker from "../../../components/RecipeIngredientPicker.svelte";
  import AmountInput from "../../../components/AmountInput.svelte";
  import { recipeIngredient } from "../../../app/recipeLinks.js";
  import { isRef, findRecipe } from "../../../app/shoppingList.js";
  import IngredientLine from "../../../components/IngredientLine.svelte";
  import { ingredientsView, moveLine, insertLine, removeLine, ungroup, findSecondUnits } from "../../../app/recipeEdit.js";

  /** @type {{ edit: import("../../../app/editState.svelte.js").RecipeEdit, recipes?: object[] }} */
  let { edit, recipes = [] } = $props();
  let picking = $state(null);
  $effect(() => { if (picking && picking.version !== edit.version) picking = null; });
  function pickRecipe(group = null, path = null) { picking = { group, path, version: edit.version }; }
  function addRecipe(recipe, batches) {
    if (!picking || picking.version !== edit.version) return;
    const next = recipeIngredient(recipe, batches);
    if (picking.path) {
      // A different target has different measures; keep only unrelated metadata.
      const { altAmounts, originalText, referenceExists, shopItem, ingkey, ...old } = viewAt(picking.path);
      set(picking.path, { ...old, ...next });
    } else if (picking.group !== null) list()[picking.group].ingredients.push(next);
    else list().push(next);
    picking = null;
  }
  const viewAt = (path) => path.length === 1 ? view[path[0]] : view[path[0]].ingredients[path[1]];
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
    {#if isRef(ing)}
      {@const target = findRecipe(recipes, ing.reference)}
      <div class="linked-ingredient-entry">
        <Input value={ing.text ?? target?.title ?? ""} aria-label="Linked recipe label" data-path={path.join(".")} onkeydown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); enter(path); }
          else if (e.altKey && ["ArrowUp", "ArrowDown"].includes(e.key)) { e.preventDefault(); move(path, e.key === "ArrowUp" ? -1 : 1); }
        }} oninput={(e) => set(path, { ...ing, text: e.currentTarget.value })} />
        <Text muted>Linked recipe: {target?.title || "Recipe unavailable"}</Text>
        <Inline wrap>
          <AmountInput times={false} label="Batches of {ing.text || 'linked recipe'}" unit="batches"
            bind:value={() => ing.amount?.amount ?? 1, (amount) => set(path, { ...ing, amount: { amount, unit: "recipe" } })} />
          <Button onclick={() => pickRecipe(null, path)}>Change recipe</Button>
          <Button onclick={() => { const { reference, referenceExists, shopItem, ingkey, ...rest } = ing; set(path, rest); }}>Unlink</Button>
        </Inline>
      </div>
    {:else}
      <IngredientLine
        {ing}
        path={path.join(".")}
        onchange={(v) => set(path, v)}
        onenter={() => enter(path)}
        onremove={() => remove(path)}
        onmove={(dir) => move(path, dir)}
      />
    {/if}
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
          <Inline wrap>
            <Button onclick={() => enter([i, ing.ingredients.length - 1].filter((n) => n >= 0))}>Add line to {ing.text || "group"}</Button>
            <Button onclick={() => pickRecipe(i)}>Add recipe to {ing.text || "group"}</Button>
          </Inline>
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
    <Button onclick={() => pickRecipe()}>Add recipe ingredient</Button>
    <Button onclick={readSecondUnits} title="Look through the lines for a second measure written in the text, like (2 sticks) or (113 g), and give it its own place">Find second units</Button>
    {#if found !== null}<Text muted>{found ? `Found ${found}. Save to keep them.` : "None to find."}</Text>{/if}
  </Inline>
  <p class="hint"><Text muted>Type a line the way you'd write it. Enter adds the next; Alt+↑/↓ moves a line, in and out of groups.</Text></p>
</div>

{#if picking}
  <RecipeIngredientPicker {recipes} current={edit.draft} onchoose={addRecipe} onclose={() => (picking = null)}
    initialBatches={picking.path ? viewAt(picking.path)?.amount?.amount ?? 1 : 1} />
{/if}
