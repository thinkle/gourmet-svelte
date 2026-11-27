<script>
  // "Clear the list": take the recipes off it, the hand-added items off it,
  // or both. Each group is a checkbox, both ticked to start with, so the
  // usual answer is one more click and a narrower answer is still possible.
  // Nothing remembered for every list (pantry, aisles, renames) is touched.
  import { untrack } from "svelte";
  import { Inline, Button, Checkbox, Text } from "contain-css-svelte";

  let { recipes = [], items = [], onclear, oncancel, clearing = false, error = null } = $props();

  // Each opening mounts a fresh dialog; the boxes start ticked for whatever
  // the list held at that moment.
  let takeRecipes = $state(untrack(() => recipes.length > 0));
  let takeItems = $state(untrack(() => items.length > 0));

  const count = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
  const recipeLabel = $derived(count(recipes.length, "recipe"));
  const itemLabel = $derived(`${count(items.length, "item")} added by hand`);
  const chosen = $derived([
    takeRecipes && recipes.length ? recipeLabel : null,
    takeItems && items.length ? count(items.length, "item") : null,
  ].filter(Boolean));

  // Long lists are summarised: the first few names, then how many are left.
  const SHOWN = 5;
  const names = (list) => {
    const shown = list.slice(0, SHOWN).join(", ");
    return list.length > SHOWN ? `${shown}, and ${list.length - SHOWN} more` : shown;
  };

  function clear(event) {
    event.preventDefault();
    if (clearing || !chosen.length) return;
    onclear({ recipes: takeRecipes && recipes.length > 0, items: takeItems && items.length > 0 });
  }
</script>

<form class="shopping-clear" onsubmit={clear}>
  <fieldset disabled={clearing}>
    <h3>Clear the shopping list?</h3>

    {#if recipes.length}
      <div class="shopping-clear-group">
        <Checkbox bind:checked={takeRecipes} aria-label="Clear {recipeLabel}"><strong>{recipeLabel}</strong></Checkbox>
        <p><small><Text muted>{names(recipes.map((recipe) => recipe.title))}</Text></small></p>
      </div>
    {/if}

    {#if items.length}
      <div class="shopping-clear-group">
        <Checkbox bind:checked={takeItems} aria-label="Clear {itemLabel}"><strong>{itemLabel}</strong></Checkbox>
        <p><small><Text muted>{names(items.map((item) => item.text))}</Text></small></p>
      </div>
    {/if}

    <p class="shopping-clear-hint"><Text muted>Pantry items, aisles and item names are remembered, whatever you clear.</Text></p>
    {#if error}<p role="alert"><Text warning>Could not clear the list: {error}</Text></p>{/if}

    <Inline wrap="wrap">
      <Button primary type="submit" disabled={!chosen.length}>
        {clearing ? "Clearing…" : chosen.length ? `Clear ${chosen.join(" and ")}` : "Clear"}
      </Button>
      <Button type="button" onclick={oncancel}>Cancel</Button>
    </Inline>
  </fieldset>
</form>
