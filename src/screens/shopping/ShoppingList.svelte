<script>
  // The shopping list, after desktop Gourmet's (specs/shopping-list.md):
  //   To buy        grouped by aisle; tap to cross off or restore in place
  //   Pantry Items  remembered for every list; shown quietly
  // Items are worked out from the recipes on the list (app/shoppingList.js);
  // saving goes through app/shopping.svelte.js.
  import { Container, Inline, Input, Button, CircleButton, Checkbox, DataList, DataListItem, Dialog, Accordion, Text, Tooltip } from "contain-css-svelte";
  import { library } from "../../app/library.svelte.js";
  import { buildList } from "../../app/shoppingList.js";
  import {
    shopping, addItem, removeItem, removeRecipe, setRecipeMultiplier,
    setCart, setAlreadyHave, wantThisTrip, doneShopping, setCategory, setCategoryOrder, renameItem,
  } from "../../app/shopping.svelte.js";
  import RecipeOnList from "./RecipeOnList.svelte";
  import ShoppingIcon from "../../components/ShoppingIcon.svelte";
  import AislePicker from "./AislePicker.svelte";
  import AisleSection from "./AisleSection.svelte";
  import { aisleName } from "./aisleKinds.js";

  const list = $derived(buildList(shopping.rec, library.recipes));
  const shoppingGroups = $derived([...list.categoryNames, null]
    .map((name) => ({ name, items: list.items.filter((item) => item.state !== "have" && item.aisle === name) }))
    .filter((group) => group.items.length));

  let draft = $state("");
  async function add(e) {
    e.preventDefault();
    const text = draft;
    draft = "";
    await addItem(text);
  }

  // Open a focused picker; choosing an aisle saves it and closes.
  let picking = $state(null); // the key of the item whose aisle is being chosen
  const pickedItem = $derived(list.items.find((item) => item.key === picking));
  async function choose(item, name) {
    picking = null;
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

{#snippet sourceDetails(item)}
  <details class="shopping-item-source">
    <summary>{unique(sources(item)).join(", ")}</summary>
    <ul class="shopping-source-details">
      {#each item.from as source}
        <li>
          {#if item.from.length > 1}<strong>{source.title ?? "Added by hand"}</strong>{/if}
          <p>{source.text}</p>
        </li>
      {/each}
    </ul>
  </details>
{/snippet}

{#snippet detail(item)}
  <p class={item.state === "cart" ? "shopping-item-name crossed-off" : "shopping-item-name"}>
    {#if amountText(item)}<strong>{amountText(item)}</strong>{" "}{/if}{item.name}
  </p>
  {@render sourceDetails(item)}
{/snippet}

{#snippet buyRow(item)}
  <DataListItem interactive class="shopping-row" aria-pressed={item.state === "cart"}
    onclick={(event) => {
      if (event.target instanceof Element && event.target.closest(".shopping-row-check, .shopping-item-source")) return;
      setCart(item.key, item.state !== "cart");
    }}>
    {#snippet start()}
      <Checkbox class="shopping-row-check" checked={item.state === "cart"} aria-label="Cross off {item.name}"
        onchange={(event) => setCart(item.key, event.currentTarget.checked)} />
    {/snippet}
    {@render detail(item)}
    {#snippet end()}
      <Tooltip tooltipText="Pantry item — keep off lists" tooltipId={`shopping-have-${encodeURIComponent(item.key)}`} horizontal="left">
        <CircleButton class="shopping-action" onclick={() => setAlreadyHave(item.key, true)} aria-label="Mark {item.name} as a pantry item"
          aria-describedby={`shopping-have-${encodeURIComponent(item.key)}`}>
          <ShoppingIcon kind="pantry" />
        </CircleButton>
      </Tooltip>
      <Tooltip tooltipText={`Change aisle: ${item.aisle ? aisleName(item.aisle) : 'none'}${item.category ? '' : ' (suggested)'}`}
        tooltipId={`shopping-aisle-${encodeURIComponent(item.key)}`} horizontal="left">
        <CircleButton class="shopping-action" onclick={() => (picking = picking === item.key ? null : item.key)}
          aria-label="Change aisle for {item.name}: {item.aisle ? aisleName(item.aisle) : 'none'}" aria-expanded={picking === item.key} aria-haspopup="dialog"
          aria-describedby={`shopping-aisle-${encodeURIComponent(item.key)}`}>
          <ShoppingIcon kind="aisle" />
        </CircleButton>
      </Tooltip>
      {#if item.looseIds.length}
        <Tooltip tooltipText="Remove item" horizontal="left">
          <CircleButton class="shopping-action" aria-label="Remove {item.name}" onclick={() => removeItem(item.looseIds)}>×</CircleButton>
        </Tooltip>
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
    {#each shoppingGroups as g (g.name ?? "")}
      <AisleSection name={g.name} showHeading={!!g.name || list.categoryNames.length > 0}>
        <DataList stackable={false}>{#each g.items as item (item.key)}{@render buyRow(item)}{/each}</DataList>
      </AisleSection>
    {:else}
      <p><Text muted>Nothing left to buy.</Text></p>
    {/each}
    {#if list.categoryNames.length > 1}
      <p><Button onclick={() => (arranging = !arranging)}>{arranging ? "Done arranging" : "Arrange aisles"}</Button></p>
      {#if arranging}
        <DataList>
          {#each list.categoryNames as name, i (name)}
            <DataListItem>
              <p>{aisleName(name)}</p>
              {#snippet end()}
                <CircleButton aria-label="Move {aisleName(name)} up" onclick={() => move(i, -1)} disabled={i === 0}>↑</CircleButton>
                <CircleButton aria-label="Move {aisleName(name)} down" onclick={() => move(i, 1)} disabled={i === list.categoryNames.length - 1}>↓</CircleButton>
              {/snippet}
            </DataListItem>
          {/each}
        </DataList>
      {/if}
    {/if}

    {#if list.cart.length}
      <p><Button primary onclick={doneShopping}>Done shopping</Button> <Text muted>{list.cart.length} crossed off</Text></p>
    {/if}

    {#if list.alreadyHave.length}
      <Accordion>
        <details>
        <summary><span class="pantry-summary"><ShoppingIcon kind="pantry" />Pantry Items ({list.alreadyHave.length})</span></summary>
        <p><Text muted>Pantry items stay off every shopping list. Recipes still use them; choose “Buy this trip” when you need to restock.</Text></p>
        <DataList>
          {#each list.alreadyHave as item (item.key)}
            <DataListItem>
              <p><Text muted>{#if amountText(item)}{amountText(item)}{" "}{/if}{item.name}</Text></p>
              {@render sourceDetails(item)}
              {#snippet end()}
                <Button onclick={() => wantThisTrip(item.key)} aria-label="Buy {item.name} this trip">Buy this trip</Button>
                <Button onclick={() => setAlreadyHave(item.key, false)} aria-label="Remove {item.name} from pantry">Remove from pantry</Button>
              {/snippet}
            </DataListItem>
          {/each}
        </DataList>
        </details>
      </Accordion>
    {/if}
  {/if}

  <Dialog open={!!pickedItem} modal class="shopping-aisle-dialog" aria-label="Change aisle" onclose={() => (picking = null)}>
    {#if pickedItem}
      <h3>Change aisle for {pickedItem.name}</h3>
      <AislePicker item={pickedItem} choices={list.aisleChoices}
        onchoose={(name) => choose(pickedItem, name)}
        onrename={() => { renaming = pickedItem; rename = pickedItem.name; picking = null; }}
        oncancel={() => (picking = null)} />
    {/if}
  </Dialog>

  <Dialog open={!!renaming} modal onclose={() => (renaming = null)}>
    <form onsubmit={saveRename}>
      <h3>Rename {renaming?.name}</h3>
      <p><label>Shopping item name <Input type="text" bind:value={rename} autocomplete="off" /></label></p>
      <p><Text muted>Recipe wording stays unchanged. This name is remembered for future lists. Using another item's name merges them.</Text></p>
      <Inline><Button primary type="submit">Save</Button><Button type="button" onclick={() => (renaming = null)}>Cancel</Button></Inline>
    </form>
  </Dialog>
</Container>
