<script>
  import { onMount } from "svelte";
  import { Page, Bar, Container, Input, Select, Option, Text, Inline, TabBar, TabItem, Button } from "contain-css-svelte";
  import { library, reload, loadFixtures } from "./library.svelte.js";
  import { startSession, signIn, signUp, signOut } from "../auth/session.js";
  import WhiskLogo from "../components/WhiskLogo.svelte";
  import { search, categoriesOf } from "./lib.js";
  import RecipeList from "../screens/list/RecipeList.svelte";
  import RecipeView from "../screens/recipe/RecipeView.svelte";

  let usingFixtures = $state(false);
  onMount(async () => {
    if (new URLSearchParams(location.search).has("fixtures")) usingFixtures = await loadFixtures();
    if (!usingFixtures) startSession();
  });

  let q = $state("");
  let cat = $state("");
  let sort = $state("modified");
  let viewport = $state(1000);
  const phone = $derived(viewport < 720);

  // Several recipes can be open at once, each in its own closeable tab.
  let openIds = $state([]);
  let tab = $state("search"); // "search" or a recipe's local id
  // Open tabs follow the library, so a recipe that syncs in again stays current.
  const openRecipes = $derived(openIds.map((id) => library.recipes.find((r) => r.id === id)).filter(Boolean));
  $effect(() => { if (tab !== "search" && !openRecipes.some((r) => r.id === tab)) tab = "search"; });

  function openRecipe(r) {
    if (!openIds.includes(r.id)) openIds.push(r.id);
    tab = r.id;
  }
  function closeRecipe(r) {
    const i = openIds.indexOf(r.id);
    if (i < 0) return;
    openIds.splice(i, 1);
    if (tab === r.id) tab = openIds[i] ?? openIds[i - 1] ?? "search";
  }
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

<svelte:window bind:innerWidth={viewport} />

<Page>
  {#snippet header()}
    <!-- On a phone an open recipe gets the whole screen: the brand bar steps aside. -->
    {#if !(phone && tab !== "search")}
      <Bar primary>
        <h1 class="brand"><img src="/images/cookie.png" alt="" />Gourmet</h1>
        {#if library.status !== "signed-out" && !usingFixtures}
          <Inline>
            {#if library.syncing}<Text>Syncing…</Text>{/if}
            <Button onclick={signOut}>Sign out</Button>
          </Inline>
        {/if}
      </Bar>
    {/if}
    {#if library.status === "ready"}
      <TabBar class="gourmet-tabs">
        <TabItem active={tab === "search"} onclick={() => (tab = "search")}
          style="--tab-indicator-color: var(--primary-bg)">Recipes</TabItem>
        {#each openRecipes as r (r.id)}
          <TabItem active={tab === r.id} onclick={() => (tab = r.id)} onclose={() => closeRecipe(r)}
            closeLabel="Close {r.title}" title={r.title} style="--tab-indicator-color: {r.color.bg}">
            <span class="tab-chip" style="--swatch-bg: {r.color.bg}; --swatch-fg: {r.color.fg};"></span>{shortTitle(r.title)}
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
    {#each openRecipes as r (r.id)}
      <div class="tab-panel" hidden={tab !== r.id}><RecipeView recipe={r} /></div>
    {/each}

    <div class="tab-panel search" hidden={tab !== "search"}>
      <Container maxWidth="56rem" height="auto">
        <Inline wrap>
          <Input type="search" placeholder="Search recipes, categories, ingredients" bind:value={q} aria-label="Search" />
          <Select bind:value={cat} aria-label="Category">
            <Option value="">All categories</Option>
            {#each categories as c}<Option value={c}>{c}</Option>{/each}
          </Select>
          <Select bind:value={sort} aria-label="Sort">
            <Option value="modified">Recently modified</Option>
            <Option value="title">Title</Option>
          </Select>
          <Text muted>{results.length} of {library.recipes.length}</Text>
        </Inline>
        {#if library.error}<p><Text warning>Showing saved recipes. Sync failed: {library.error}</Text></p>{/if}
      </Container>
      <Container maxWidth="56rem" height="auto">
        <RecipeList {results} onopen={openRecipe} />
      </Container>
    </div>
  {/if}
</Page>
