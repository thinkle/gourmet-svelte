<script>
  // The shopping list: what is on it, what to buy (merged), what is ticked.
  // Items are worked out from the recipes on the list (app/shoppingList.js);
  // saving goes through app/shopping.svelte.js.
  import { Container, Inline, Input, Button, CircleButton, Checkbox, DataList, DataListItem, Text } from "contain-css-svelte";
  import { library } from "../../app/library.svelte.js";
  import { buildList } from "../../app/shoppingList.js";
  import { shopping, addItem, removeItem, removeRecipe, setRecipeMultiplier, setChecked, clearChecked } from "../../app/shopping.svelte.js";
  import RecipeOnList from "./RecipeOnList.svelte";

  const list = $derived(buildList(shopping.rec, library.recipes));
  const toBuy = $derived(list.items.filter((i) => !i.checked));
  const got = $derived(list.items.filter((i) => i.checked));

  let draft = $state("");
  async function add(e) {
    e.preventDefault();
    const text = draft;
    draft = "";
    await addItem(text);
  }
  const sources = (item) => item.from.map((f) => (f.title ? (f.mult !== 1 ? `${f.title} ×${+f.mult.toFixed(2)}` : f.title) : "added by hand"));
  const unique = (xs) => [...new Set(xs)];
</script>

{#snippet row(item)}
  <DataListItem>
    {#snippet start()}
      <Checkbox bind:checked={() => item.checked, (on) => setChecked(item.key, on, list.keys)} aria-label="Got {item.name}" />
    {/snippet}
    <p>
      {#if item.amounts.length}<strong>{item.amounts.map((a) => a.text).join(" + ")}</strong>{/if}
      {item.name}
    </p>
    <p><Text muted>{unique(sources(item)).join(", ")}</Text></p>
    {#snippet end()}
      {#if item.looseIds.length}
        <CircleButton aria-label="Remove {item.name}" onclick={() => removeItem(item.looseIds)}>×</CircleButton>
      {/if}
    {/snippet}
  </DataListItem>
{/snippet}

<Container maxWidth="40rem" height="auto">
  <h2>Shopping list</h2>
  {#if shopping.error}<p><Text warning>Could not save the list: {shopping.error}</Text></p>{/if}

  <form onsubmit={add}>
    <Inline>
      <Input type="text" placeholder="Add an item, like 2 lb onions" bind:value={draft} aria-label="Add an item" autocomplete="off" />
      <Button primary type="submit">Add</Button>
    </Inline>
  </form>

  {#if list.recipes.length}
    <h3>For {list.recipes.length} {list.recipes.length === 1 ? "recipe" : "recipes"}</h3>
    {#each list.recipes as r (r.id)}
      <RecipeOnList entry={r} onchange={(m) => setRecipeMultiplier(r.id, m)} onremove={() => removeRecipe(r.id)} />
    {/each}
  {/if}

  {#if !list.items.length}
    <p><Text muted>Nothing on the list yet. Open a recipe and choose "Add to shopping list", or type an item above.</Text></p>
  {:else}
    <h3>To buy</h3>
    {#if toBuy.length}
      <DataList>{#each toBuy as item (item.key)}{@render row(item)}{/each}</DataList>
    {:else}<p><Text muted>Everything is ticked off.</Text></p>{/if}

    {#if got.length}
      <h3>Got it</h3>
      <DataList>{#each got as item (item.key)}{@render row(item)}{/each}</DataList>
      <p><Button onclick={clearChecked}>Clear ticked</Button></p>
    {/if}
  {/if}
</Container>
