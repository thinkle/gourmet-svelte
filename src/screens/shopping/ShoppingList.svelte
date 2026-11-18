<script>
  // The shopping list, after desktop Gourmet's (specs/shopping-list.md):
  //   To buy        grouped by aisle (shopping category); tap an item to put it in the cart
  //   In the cart   this trip only; "Done shopping" empties it
  //   Already have  remembered for every list; shown quietly
  // Items are worked out from the recipes on the list (app/shoppingList.js);
  // saving goes through app/shopping.svelte.js.
  import { Container, Inline, Input, Button, CircleButton, DataList, DataListItem, Dialog, Accordion, Text } from "contain-css-svelte";
  import { library } from "../../app/library.svelte.js";
  import { buildList } from "../../app/shoppingList.js";
  import {
    shopping, addItem, removeItem, removeRecipe, setRecipeMultiplier,
    setCart, setAlreadyHave, wantThisTrip, doneShopping, setCategory, setCategoryOrder, renameItem,
  } from "../../app/shopping.svelte.js";
  import RecipeOnList from "./RecipeOnList.svelte";

  const list = $derived(buildList(shopping.rec, library.recipes));

  let draft = $state("");
  async function add(e) {
    e.preventDefault();
    const text = draft;
    draft = "";
    await addItem(text);
  }

  // One tap on the aisle chip opens the choices; one tap on a choice saves it and closes.
  let picking = $state(null); // the key of the item whose aisle is being chosen
  let newAisle = $state("");
  async function choose(item, name) {
    picking = null;
    newAisle = "";
    if ((name ?? "") !== (item.category ?? "")) await setCategory(item.key, name);
  }
  // Rename or merge: typing another item's name makes them one item.
  let renaming = $state(null);
  let rename = $state("");
  async function saveRename(e) {
    e.preventDefault();
    const item = renaming;
    renaming = null;
    if (rename.trim() && rename.trim().toLowerCase() !== item.key) await renameItem(item.baseKeys, item.key, rename);
  }

  let arranging = $state(false);
  function move(i, dir) {
    const names = [...list.categoryNames];
    const j = i + dir;
    if (j < 0 || j >= names.length) return;
    [names[i], names[j]] = [names[j], names[i]];
    setCategoryOrder(names);
  }

  const sources = (item) => item.from.map((f) => (f.title ? (f.mult !== 1 ? `${f.title} ×${+f.mult.toFixed(2)}` : f.title) : "added by hand"));
  const unique = (xs) => [...new Set(xs)];
  const amountText = (item) => item.amounts.map((a) => a.text).join(" + ");
</script>

{#snippet detail(item)}
  <p>
    {#if amountText(item)}<strong>{amountText(item)}</strong>{" "}{/if}{item.name}
  </p>
  <p><Text muted>{unique(sources(item)).join(", ")}</Text></p>
  {#if picking === item.key}
    <Inline wrap>
      {#each list.aisleChoices as name (name)}
        <Button primary={name === item.category} onclick={() => choose(item, name)} aria-label="Put {item.name} in {name}">{name}</Button>
      {/each}
      <Input type="text" placeholder="New aisle" bind:value={newAisle} aria-label="New aisle for {item.name}" autocomplete="off"
        onkeydown={(e) => { if (e.key === "Enter" && newAisle.trim()) { e.preventDefault(); choose(item, newAisle); } }} />
      {#if item.category}<Button onclick={() => choose(item, "")} aria-label="Forget the aisle for {item.name}">Clear</Button>{/if}
      <Button onclick={() => { renaming = item; rename = item.name; picking = null; }} aria-label="Rename {item.name}">Rename…</Button>
    </Inline>
  {/if}
{/snippet}

{#snippet buyRow(item)}
  <DataListItem interactive onclick={() => setCart(item.key, true)}>
    {@render detail(item)}
    {#snippet end()}
      <Button onclick={() => setAlreadyHave(item.key, true)} aria-label="Already have {item.name}">Already have</Button>
      <Button onclick={() => (picking = picking === item.key ? null : item.key)} aria-label="Aisle for {item.name}: {item.aisle ?? 'none'}"
        class={item.category ? "" : "guess"}>{item.aisle ?? "Aisle"}</Button>
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
    {#each list.groups as g (g.name ?? "")}
      {#if g.name || list.categoryNames.length}<h4>{g.name ?? "Other"}</h4>{/if}
      <DataList>{#each g.items as item (item.key)}{@render buyRow(item)}{/each}</DataList>
    {:else}
      <p><Text muted>Nothing left to buy.</Text></p>
    {/each}
    {#if list.categoryNames.length > 1}
      <p><Button onclick={() => (arranging = !arranging)}>{arranging ? "Done arranging" : "Arrange aisles"}</Button></p>
      {#if arranging}
        <DataList>
          {#each list.categoryNames as name, i (name)}
            <DataListItem>
              <p>{name}</p>
              {#snippet end()}
                <CircleButton aria-label="Move {name} up" onclick={() => move(i, -1)} disabled={i === 0}>↑</CircleButton>
                <CircleButton aria-label="Move {name} down" onclick={() => move(i, 1)} disabled={i === list.categoryNames.length - 1}>↓</CircleButton>
              {/snippet}
            </DataListItem>
          {/each}
        </DataList>
      {/if}
    {/if}

    {#if list.cart.length}
      <Accordion>
        <details>
        <summary>In the cart ({list.cart.length})</summary>
        <DataList>
          {#each list.cart as item (item.key)}
            <DataListItem interactive onclick={() => setCart(item.key, false)}>
              <p><Text muted>{#if amountText(item)}{amountText(item)}{" "}{/if}{item.name}</Text></p>
              {#snippet end()}<Text muted>tap to put back</Text>{/snippet}
            </DataListItem>
          {/each}
        </DataList>
        </details>
      </Accordion>
      <p><Button primary onclick={doneShopping}>Done shopping</Button></p>
    {/if}

    {#if list.alreadyHave.length}
      <Accordion>
        <details>
        <summary>Already have ({list.alreadyHave.length})</summary>
        <p><Text muted>Remembered for every recipe and list. Recipes still use them; they are just not on your list.</Text></p>
        <DataList>
          {#each list.alreadyHave as item (item.key)}
            <DataListItem>
              <p><Text muted>{#if amountText(item)}{amountText(item)}{" "}{/if}{item.name}</Text></p>
              {#snippet end()}
                <Button onclick={() => wantThisTrip(item.key)} aria-label="Buy {item.name} this trip">Buy this trip</Button>
                <Button onclick={() => setAlreadyHave(item.key, false)} aria-label="Stop having {item.name} for good">Don't have it</Button>
              {/snippet}
            </DataListItem>
          {/each}
        </DataList>
        </details>
      </Accordion>
    {/if}
  {/if}

  <Dialog open={!!renaming} modal onclose={() => (renaming = null)}>
    <form onsubmit={saveRename}>
      <h3>Rename {renaming?.name}</h3>
      <p><label>Same as <Input type="text" bind:value={rename} autocomplete="off" /></label></p>
      <p><Text muted>Typing another item's name merges the two on every list.</Text></p>
      <Inline><Button primary type="submit">Save</Button><Button type="button" onclick={() => (renaming = null)}>Cancel</Button></Inline>
    </form>
  </Dialog>
</Container>
