<script>
  import { onMount, untrack } from "svelte";
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
    live, setLiveShoppingVisible, toggleLiveShopping, retryLiveShopping,
  } from "../../app/shopping.svelte.js";
  import RecipeOnList from "./RecipeOnList.svelte";
  import ShoppingIcon from "../../components/ShoppingIcon.svelte";
  import ShoppingItemEditor from "./ShoppingItemEditor.svelte";
  import AisleSection from "./AisleSection.svelte";
  import { aisleName } from "./aisleKinds.js";

  let { active = true } = $props();
  let explainingLive = $state(false);
  const liveBusy = $derived(live.status === 'joining' || live.status === 'syncing');
  const editingPaused = $derived(live.enabled || live.status === 'joining');
  $effect(() => {
    const visible = active && library.status === 'ready' && !library.syncing;
    untrack(() => setLiveShoppingVisible(visible));
  });
  onMount(() => {
    const wake = () => setLiveShoppingVisible(active && library.status === 'ready' && !library.syncing);
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    window.addEventListener('offline', wake);
    return () => {
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      window.removeEventListener('offline', wake);
      setLiveShoppingVisible(false);
    };
  });

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

  // Snapshot the item while editing so a rename does not unmount its drafts.
  let picking = $state(null);
  let savingItem = $state(false);
  function closeItemEditor() {
    if (!savingItem) picking = null;
  }
  async function saveItem({ name, category }) {
    if (savingItem || !picking || !name.trim()) return;
    savingItem = true;
    try {
      let item = picking;
      const key = name.toLowerCase();
      if (key !== item.key) {
        await renameItem(item.baseKeys, item.key, name);
        if (shopping.error) return;
        // On a category-save failure, retry against the renamed key.
        item = { ...item, key, name };
        picking = item;
      }
      if (category !== undefined) {
        await setCategory(item.key, category);
        if (shopping.error) return;
      }
      picking = null;
    } finally {
      savingItem = false;
    }
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
        <CircleButton disabled={editingPaused} class="shopping-action" onclick={() => setAlreadyHave(item.key, true)} aria-label="Mark {item.name} as a pantry item"
          aria-describedby={`shopping-have-${encodeURIComponent(item.key)}`}>
          <ShoppingIcon kind="pantry" />
        </CircleButton>
      </Tooltip>
      <Tooltip tooltipText={`Edit name or category: ${item.aisle ? aisleName(item.aisle) : 'none'}${item.category ? '' : ' (suggested)'}`}
        tooltipId={`shopping-aisle-${encodeURIComponent(item.key)}`} horizontal="left">
        <CircleButton disabled={editingPaused} class="shopping-action" onclick={() => (picking = item)}
          aria-label="Edit shopping item {item.name}" aria-expanded={picking?.key === item.key} aria-haspopup="dialog"
          aria-describedby={`shopping-aisle-${encodeURIComponent(item.key)}`}>
          <ShoppingIcon kind="aisle" />
        </CircleButton>
      </Tooltip>
      {#if item.looseIds.length}
        <Tooltip tooltipText="Remove item" horizontal="left">
          <CircleButton disabled={editingPaused} class="shopping-action" aria-label="Remove {item.name}" onclick={() => removeItem(item.looseIds)}>×</CircleButton>
        </Tooltip>
      {/if}
    {/snippet}
  </DataListItem>
{/snippet}

<Container maxWidth="40rem" height="auto">
  <Inline>
    <h2>Shopping list</h2>
    <Tooltip tooltipText={live.enabled ? 'Live shopping is on' : 'Shop together: live mode'}>
      <CircleButton primary={live.enabled} aria-label="Live shopping settings" aria-haspopup="dialog"
        aria-expanded={explainingLive} onclick={() => (explainingLive = true)}>
        <ShoppingIcon kind="live" />
      </CircleButton>
    </Tooltip>
  </Inline>
  {#if live.enabled}
    <p role="status"><Text muted>Live shopping · {live.pending ? `${live.pending} change${live.pending === 1 ? '' : 's'} saved on this phone` : live.status === 'synced' ? 'Up to date' : live.status === 'syncing' ? 'Syncing…' : 'Paused — changes stay on this phone'}</Text></p>
    <p><Text muted>Check items together. Turn live mode off to edit the list.</Text></p>
  {/if}
  {#if live.notice}<p role="status"><Text warning>{live.notice}</Text></p>{/if}
  {#if live.error}
    <p role="status"><Text warning>{live.error}</Text> {#if live.enabled}<Button onclick={retryLiveShopping}>Retry sync</Button>{/if}</p>
  {/if}
  {#if shopping.error}<p><Text warning>Could not save the list: {shopping.error}</Text></p>{/if}

  <form onsubmit={add}>
    <Inline>
      <Input disabled={editingPaused} type="text" placeholder="Add an item, like 2 lb onions" bind:value={draft} aria-label="Add an item" autocomplete="off" />
      <Button disabled={editingPaused} primary type="submit">Add</Button>
    </Inline>
  </form>

  {#if list.recipes.length}
    <h3>For {list.recipes.length} {list.recipes.length === 1 ? "recipe" : "recipes"}</h3>
    {#each list.recipes as r (r.id)}
      {#if editingPaused}<p>{r.title}{r.mult !== 1 ? ` ×${r.mult}` : ''}</p>
      {:else}<RecipeOnList entry={r} onchange={(m) => setRecipeMultiplier(r.id, m)} onremove={() => removeRecipe(r.id)} />{/if}
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
      <p><Button disabled={editingPaused} onclick={() => (arranging = !arranging)}>{arranging ? "Done arranging" : "Arrange aisles"}</Button></p>
      {#if arranging && !editingPaused}
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
                <Button disabled={editingPaused} onclick={() => wantThisTrip(item.key)} aria-label="Buy {item.name} this trip">Buy this trip</Button>
                <Button disabled={editingPaused} onclick={() => setAlreadyHave(item.key, false)} aria-label="Remove {item.name} from pantry">Remove from pantry</Button>
              {/snippet}
            </DataListItem>
          {/each}
        </DataList>
        </details>
      </Accordion>
    {/if}
  {/if}

  <Dialog open={!!picking} modal class="shopping-item-dialog" aria-label="Edit shopping item" onclose={closeItemEditor}
    oncancel={(event) => { if (savingItem) event.preventDefault(); }}>
    {#if picking}
      <ShoppingItemEditor item={picking} choices={list.aisleChoices}
        onsave={saveItem} oncancel={closeItemEditor} saving={savingItem} error={shopping.error} />
    {/if}
  </Dialog>
  <Dialog open={explainingLive} modal aria-label="Live shopping" onclose={() => (explainingLive = false)}>
    <h2>Shop together</h2>
    <p>Turn on live mode on both phones to share checkmarks on this shopping list. Use the same account or an existing linked account.</p>
    <p>Updates arrive about every five seconds while this screen is open. Offline checkmarks are saved on your phone and sent when you return here with a connection.</p>
    <p>Live mode shares checkmarks and “Done shopping.” Turn it off to add items, change recipes, or edit names and aisles. “Done shopping” ends this trip and turns live mode off on both phones once each reconnects.</p>
    <p>Live mode is off by default. Once enabled, this phone remembers it until you turn it off or finish the trip.</p>
    {#if live.error}<p><Text warning>{live.error}</Text></p>{/if}
    <Inline>
      <Button primary disabled={liveBusy || (live.enabled && live.pending > 0)} onclick={toggleLiveShopping}>
        {live.enabled ? 'Turn live mode off' : live.status === 'joining' ? 'Connecting…' : 'Turn live mode on'}
      </Button>
      <Button onclick={() => (explainingLive = false)}>Close</Button>
    </Inline>
    {#if live.enabled && live.pending}<p>Let your saved changes sync before turning live mode off. You can close this dialog or leave the screen now.</p>{/if}
  </Dialog>
</Container>
