<script>
  // The shopping list: what is on it, what to buy (merged), what is ticked,
  // and the pantry (things you always have). Items are worked out from the
  // recipes on the list (app/shoppingList.js); saving goes through
  // app/shopping.svelte.js.
  import { Container, Inline, Input, Button, CircleButton, Checkbox, DataList, DataListItem, Text } from "contain-css-svelte";
  import { library } from "../../app/library.svelte.js";
  import { buildList } from "../../app/shoppingList.js";
  import { shopping, addItem, removeItem, removeRecipe, setRecipeMultiplier, setChecked, clearChecked, setPantry, putBack, addToPantry } from "../../app/shopping.svelte.js";
  import RecipeOnList from "./RecipeOnList.svelte";

  const list = $derived(buildList(shopping.rec, library.recipes));
  const toBuy = $derived(list.items.filter((i) => !i.inPantry && !i.checked));
  const got = $derived(list.items.filter((i) => !i.inPantry && i.checked));
  const pantry = $derived(list.items.filter((i) => i.inPantry));
  const pantrySize = $derived(pantry.length + list.pantryOnly.length);

  let draft = $state("");
  async function add(e) {
    e.preventDefault();
    const text = draft;
    draft = "";
    await addItem(text);
  }
  let pantryDraft = $state("");
  async function addPantry(e) {
    e.preventDefault();
    const text = pantryDraft;
    pantryDraft = "";
    await addToPantry(text);
  }
  let editingPantry = $state(false);
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
      <Button onclick={() => setPantry(item.key, true)} aria-label="Always have {item.name}">Always have it</Button>
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
    {:else}<p><Text muted>Everything is ticked off or in your pantry.</Text></p>{/if}

    {#if got.length}
      <h3>Got it</h3>
      <DataList>{#each got as item (item.key)}{@render row(item)}{/each}</DataList>
      <p><Button onclick={clearChecked}>Clear ticked</Button></p>
    {/if}
  {/if}

  {#if pantrySize || editingPantry}
    <h3>In your pantry</h3>
    <p><Text muted>Things you always have. Recipes use them, but they are not on your shopping list.</Text></p>
    <DataList>
      {#each pantry as item (item.key)}
        <DataListItem>
          <p><Text muted>{#if item.amounts.length}{item.amounts.map((a) => a.text).join(" + ")}{" "}{/if}{item.name}</Text></p>
          {#snippet end()}
            <Button onclick={() => putBack(item.key)} aria-label="Put {item.name} back on the list">Put back</Button>
            {#if editingPantry}<CircleButton aria-label="Remove {item.name} from the pantry" onclick={() => setPantry(item.key, false, item.hint)}>×</CircleButton>{/if}
          {/snippet}
        </DataListItem>
      {/each}
      {#each list.pantryOnly as key (key)}
        <DataListItem>
          <p><Text muted>{key}</Text></p>
          {#snippet end()}
            {#if editingPantry}<CircleButton aria-label="Remove {key} from the pantry" onclick={() => setPantry(key, false)}>×</CircleButton>{/if}
          {/snippet}
        </DataListItem>
      {/each}
    </DataList>
    {#if editingPantry}
      <form onsubmit={addPantry}>
        <Inline>
          <Input type="text" placeholder="Add to pantry, like olive oil" bind:value={pantryDraft} aria-label="Add to pantry" autocomplete="off" />
          <Button type="submit">Add</Button>
        </Inline>
      </form>
    {/if}
    <p><Button onclick={() => (editingPantry = !editingPantry)}>{editingPantry ? "Done" : "Edit pantry"}</Button></p>
  {:else}
    <p><Button onclick={() => (editingPantry = true)}>Set up your pantry</Button></p>
  {/if}
</Container>
