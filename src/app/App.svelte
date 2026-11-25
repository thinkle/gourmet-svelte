<script>
  import { onMount, untrack } from "svelte";
  import { Page, Bar, Container, Input, Select, Option, Text, Inline, TabBar, TabItem, Button } from "contain-css-svelte";
  import { library, reload, loadFixtures, storedRecipe, putRecipe, editorData } from "./library.svelte.js";
  import { startSession, signIn, signUp, signOut } from "../auth/session.js";
  import WhiskLogo from "../components/WhiskLogo.svelte";
  import { search, categoriesOf, prepare } from "./lib.js";
  import { blankRecipe } from "./recipeEdit.js";
  import { ask } from "./confirm.svelte.js";
  import RecipeList from "../screens/list/RecipeList.svelte";
  import RecipeView from "../screens/recipe/RecipeView.svelte";
  import ConfirmHost from "../components/ConfirmHost.svelte";
  import ShoppingList from "../screens/shopping/ShoppingList.svelte";
  import { shopping, loadShopping, useLocalOnly } from "./shopping.svelte.js";
  import { buildList } from "./shoppingList.js";
  import { readRecipeTabs, writeRecipeTabs } from "./recipeTabs.js";

  let usingFixtures = $state(false);
  onMount(async () => {
    if (new URLSearchParams(location.search).has("fixtures")) {
      useLocalOnly(); // fixtures mode never reaches the server, whatever else happens
      usingFixtures = await loadFixtures();
    }
    if (!usingFixtures) startSession();
  });

  let q = $state("");
  let cat = $state("");
  let sort = $state("modified");
  let viewport = $state(1000);
  const phone = $derived(viewport < 720);

  // Several recipes can be open at once, each in its own closeable tab. A
  // tab's key is the recipe's local id, or "new-N" for a recipe not yet saved.
  let openIds = $state([]);
  let tab = $state("search"); // "search", "shopping" or a tab key
  let drafts = $state({}); // "new-N" -> the prepared blank shown while it is new
  let dirty = $state({}); // tab key -> has unsaved edits
  let newCount = 0;
  let tabsRestored = $state(false);
  // Wait for the first sync, including recipes absent from this device's cache.
  // Do not overwrite the bookmark while signing in or receiving partial batches.
  $effect(() => {
    if (!tabsRestored && library.status === "ready" && !library.syncing && !library.error) {
      untrack(() => {
        restoreTabs(true);
        tabsRestored = true;
      });
    }
  });
  function restoreTabs(initial = false) {
    const restored = readRecipeTabs(location.hash, library.recipes);
    const keepActive = initial && (openIds.length > 0 || tab === "shopping");
    // Following another hash must never throw away an unsaved editor.
    openIds = [...new Set([...restored.ids, ...openIds.filter((key) => initial || dirty[key])])];
    if (!keepActive) tab = restored.tab;
  }
  function hashChanged() {
    if (tabsRestored) restoreTabs();
  }
  $effect(() => {
    if (!tabsRestored || library.status !== "ready") return;
    const hash = writeRecipeTabs(location.hash, openIds, tab, library.recipes);
    // Replacing keeps tab clicks from filling the browser's Back history.
    if (hash !== location.hash) history.replaceState(history.state, "", `${location.pathname}${location.search}${hash}`);
  });
  // Open tabs follow the library, so a recipe that syncs in again stays current.
  const openTabs = $derived(openIds
    .map((key) => ({ key, recipe: drafts[key] ?? library.recipes.find((r) => r.id === key) }))
    .filter((t) => t.recipe));
  $effect(() => { if (tab !== "search" && tab !== "shopping" && !openTabs.some((t) => t.key === tab)) tab = "search"; });

  function openRecipe(r) {
    if (!openIds.includes(r.id)) openIds.push(r.id);
    tab = r.id;
  }
  function newRecipe() {
    const key = `new-${++newCount}`;
    drafts[key] = { ...prepare(blankRecipe()), title: "New recipe" };
    openIds.push(key);
    tab = key;
  }
  function forget(key) {
    const i = openIds.indexOf(key);
    if (i < 0) return;
    openIds.splice(i, 1);
    delete drafts[key];
    delete dirty[key];
    if (tab === key) tab = openIds[i] ?? openIds[i - 1] ?? "search";
  }
  async function closeRecipe(key) {
    if (dirty[key] && !(await ask({ title: "Close without saving?", body: "Your unsaved changes to this recipe will be lost.", yes: "Discard changes", no: "Keep editing", danger: true }))) return;
    forget(key);
  }
  // Saved: the tab now shows the stored recipe (a new one gets its real id).
  function saved(key, row) {
    putRecipe(row);
    dirty[key] = false;
    if (key !== row.id) {
      openIds[openIds.indexOf(key)] = row.id;
      delete drafts[key];
      delete dirty[key];
      if (tab === key) tab = row.id;
    }
  }
  function deleted(key, row) {
    putRecipe(row);
    forget(key);
  }
  // The shopping list is read from the cache once recipes are ready and again after each sync.
  $effect(() => { if (library.status === "ready" && !library.syncing) loadShopping(); });
  const shopCount = $derived(buildList(shopping.rec, library.recipes).buyCount);
  const shortTitle = (t) => (t.length > 26 ? t.slice(0, 25).trimEnd() + "…" : t);

  const categories = $derived(categoriesOf(library.recipes));
  // Search ranks by where the words matched; the chosen sort breaks ties
  // (and is the whole order when the box is empty).
  const results = $derived.by(() => {
    const pool = cat ? library.recipes.filter((r) => r.cats.includes(cat)) : library.recipes;
    const order = sort === "title"
      ? (a, b) => a.recipe.title.localeCompare(b.recipe.title)
      : (a, b) => (b.recipe.last_modified ?? 0) - (a.recipe.last_modified ?? 0);
    return search(pool, q).sort((a, b) => b.score - a.score || order(a, b));
  });
</script>

<svelte:window bind:innerWidth={viewport} onhashchange={hashChanged} />

<Page>
  {#snippet header()}
    <!-- On a phone an open recipe gets the whole screen: the brand bar steps aside. -->
    {#if !(phone && tab !== "search" && tab !== "shopping")}
      <Bar primary>
        <h1 class="brand"><img src="/images/cookie.png" alt="" />Gourmet</h1>
        {#if library.status !== "signed-out" && !usingFixtures}
          <Inline>
            <Button onclick={reload} disabled={library.syncing || library.status !== "ready"}
              aria-label="Sync recipes with the cloud">{library.syncing ? "Syncing…" : "Sync recipes"}</Button>
            <Button onclick={signOut}>Sign out</Button>
          </Inline>
        {/if}
      </Bar>
    {/if}
    {#if library.status === "ready" && library.error}
      <p role="status"><Text warning>Showing saved recipes. Sync failed: {library.error}</Text></p>
    {/if}
    {#if library.status === "ready"}
      <TabBar class="gourmet-tabs">
        <TabItem active={tab === "search"} onclick={() => (tab = "search")}
          style="--tab-indicator-color: var(--primary-bg)">Recipes</TabItem>
        <TabItem active={tab === "shopping"} onclick={() => (tab = "shopping")}
          style="--tab-indicator-color: var(--primary-bg)">Shopping list{shopCount ? ` (${shopCount})` : ""}</TabItem>
        {#each openTabs as { key, recipe: r } (key)}
          <TabItem active={tab === key} onclick={() => (tab = key)} onclose={() => closeRecipe(key)}
            closeLabel="Close {r.title}" title={dirty[key] ? `${r.title} (unsaved changes)` : r.title}
            style="--tab-indicator-color: {r.color.bg}">
            <span class="tab-chip" style="--swatch-bg: {r.color.bg}; --swatch-accent: {r.color.accent ?? r.color.fg};"></span>{shortTitle(r.title)}{#if dirty[key]}<span class="tab-dirty" aria-label="unsaved changes">•</span>{/if}
          </TabItem>
        {/each}
      </TabBar>
    {/if}
  {/snippet}

  {#if library.status === "signed-out"}
    <Container maxWidth="32rem" height="auto">
      <div class="welcome">
        <img src="/images/cookie.png" alt="" />
        <h2>Gourmet <small>Web Edition</small></h2>
        <blockquote>
          Keep all your favorite recipes together,<br />no matter where they come from,<br />no matter what device you use.
        </blockquote>
        <Inline><Button primary onclick={signIn}>Log in</Button><Button onclick={signUp}>Sign up</Button></Inline>
      </div>
    </Container>
  {:else if library.status === "signing-in" || library.status === "loading"}
    <Container maxWidth="32rem" height="auto">
      <div class="loading">
        <WhiskLogo size={220} loop label={library.status === "signing-in" ? "Signing in" : "Fetching your recipes"} />
        <p><Text muted>{library.status === "signing-in" ? "Signing in…" : "Fetching your recipes…"}</Text></p>
      </div>
    </Container>
  {:else if library.status === "error"}
    <Container maxWidth="32rem" height="auto">
      <h2>Could not load your recipes</h2>
      <p>{library.error}</p>
      <Inline><Button primary onclick={reload}>Try again</Button><Button onclick={signOut}>Sign out</Button></Inline>
    </Container>
  {:else}
    <!-- Every open recipe stays mounted, so each keeps its scroll position and multiplier. -->
    {#each openTabs as { key, recipe: r } (key)}
      <div class="tab-panel" hidden={tab !== key}>
        <RecipeView recipe={r}
          stored={() => (key in drafts ? blankRecipe() : storedRecipe(key))}
          startEditing={key in drafts}
          suggestions={categories}
          data={editorData}
          onsaved={(row) => saved(key, row)}
          ondeleted={(row) => deleted(key, row)}
          onclose={() => forget(key)}
          ondirty={(d) => (dirty[key] = d)} />
      </div>
    {/each}

    <div class="tab-panel search" hidden={tab !== "shopping"}><ShoppingList /></div>

    <div class="tab-panel search" hidden={tab !== "search"}>
      <Container maxWidth="56rem" height="auto">
        <Inline wrap>
          <Input type="search" placeholder="Search recipes, categories, sources, ingredients" bind:value={q} aria-label="Search" />
          <Select bind:value={cat} aria-label="Category">
            <Option value="">All categories</Option>
            {#each categories as c}<Option value={c}>{c}</Option>{/each}
          </Select>
          <Select bind:value={sort} aria-label="Sort">
            <Option value="modified">Recently modified</Option>
            <Option value="title">Title</Option>
          </Select>
          <Text muted>{results.length} of {library.recipes.length}</Text>
          <Button primary onclick={newRecipe}>New recipe</Button>
        </Inline>
      </Container>
      <Container maxWidth="56rem" height="auto">
        <RecipeList {results} onopen={openRecipe} />
      </Container>
    </div>
  {/if}
</Page>

<ConfirmHost />
