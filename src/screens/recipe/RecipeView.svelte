<script>
  // One open recipe. The ingredient list must never be out of reach.
  // Wide: ingredients and text side by side, each scrolling on its own.
  // Phone: one column that reads top to bottom; once the ingredients have
  // scrolled away, a floating button brings them back as a sheet over the
  // lower part of the screen, wherever you are in the text.
  import { tick } from "svelte";
  import { fly, scale } from "svelte/transition";
  import { SplitPane, GroupedRadioItem, GroupedToggle, Text } from "contain-css-svelte";
  import Ingredients from "./Ingredients.svelte";
  import RecipeHero from "./RecipeHero.svelte";
  import { markIngredients, recipeRole } from "../../app/lib.js";
  let { recipe } = $props();

  let mult = $state(1);
  const presets = [0.5, 1, 2, 3];
  let width = $state(1000);
  const wide = $derived(width >= 720);

  // The ingredient both sides are pointing at.
  let active = $state(null);
  let listEl = $state();   // the ingredient list in the page (pane or inline)
  let sheetEl = $state();  // the same list inside the phone sheet
  let textEl = $state();   // the scrolling text (pane, or the whole column on a phone)

  // Phone only: is the in-page ingredient list on screen, and is the sheet up?
  let listOnScreen = $state(true);
  let sheetOpen = $state(false);
  $effect(() => {
    if (wide || !listEl) return;
    const seen = new IntersectionObserver(([e]) => (listOnScreen = e.isIntersecting), { root: textEl, threshold: 0.05 });
    seen.observe(listEl);
    return () => seen.disconnect();
  });
  // Scrolling back up to the list itself puts the sheet away.
  $effect(() => { if (wide || listOnScreen) sheetOpen = false; });

  const blocks = $derived((recipe.text ?? []).map((t) => ({ header: t.header, html: markIngredients(t.body, recipe.ingredients) })));
  const count = $derived(recipe.flat.length);

  // Keep the marked-up mentions in the text in step with `active`.
  $effect(() => {
    const now = active;
    textEl?.querySelectorAll("ing").forEach((el) => el.classList.toggle("active", el.getAttribute("target") === now));
  });

  // From a list: light up its mentions and bring the first into view.
  async function pickIngredient(text) {
    active = active === text ? null : text;
    await tick();
    if (active) textEl?.querySelector("ing.active")?.scrollIntoView({ block: wide ? "center" : "start", behavior: "smooth" });
  }
  // From the text: light up the ingredient and bring it into view, in its
  // pane, or on a phone in the sheet when the list has scrolled away.
  async function pickMention(event) {
    const el = event.target.closest?.("ing");
    if (!el) return;
    active = el.getAttribute("target");
    if (!wide && !listOnScreen) sheetOpen = true;
    await tick();
    const where = !wide && sheetOpen ? sheetEl : listEl;
    where?.querySelector(".ingredient.active")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
</script>

{#snippet head(onclose)}
  <header class="pane-head">
    <h2>Ingredients</h2>
    <GroupedToggle role="radiogroup" aria-label="Multiply the recipe">
      {#each presets as p}
        <GroupedRadioItem group={mult} value={p} onclick={() => (mult = p)}>{p === 0.5 ? "½" : p}×</GroupedRadioItem>
      {/each}
    </GroupedToggle>
    {#if onclose}<button type="button" class="sheet-close" aria-label="Hide ingredients" onclick={onclose}>×</button>{/if}
  </header>
{/snippet}

{#snippet list()}
  {#if count}
    <Ingredients list={recipe.ingredients} {mult} {active} onpick={pickIngredient} />
  {:else}<p><Text muted>No ingredients.</Text></p>{/if}
{/snippet}

{#snippet prose()}
  <div class="recipe-prose">
    {#each blocks as b}
      {#if b.header}<h2>{b.header}</h2>{/if}
      {@html b.html}
    {:else}<p><Text muted>No instructions.</Text></p>{/each}
  </div>
{/snippet}

<div class="recipe-view" class:wide bind:clientWidth={width} style={recipeRole(recipe.color)}>
  {#if wide}
    <SplitPane leftWidth="22rem" height="100%" resizerLabel="Resize the ingredients" resizeBehavior="preserve-left">
      {#snippet left()}
        <section class="pane ingredients-pane" bind:this={listEl} aria-label="Ingredients">
          {@render head()}{@render list()}
        </section>
      {/snippet}
      {#snippet right()}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
        <article class="pane text-pane" bind:this={textEl} onclick={pickMention}>
          <RecipeHero {recipe} />
          {@render prose()}
        </article>
      {/snippet}
    </SplitPane>
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <article class="pane column" class:sheet-up={sheetOpen} bind:this={textEl} onclick={pickMention}>
      <RecipeHero {recipe} />
      <section class="ingredients-inline" bind:this={listEl} aria-label="Ingredients">
        {@render head()}{@render list()}
      </section>
      {@render prose()}
    </article>

    {#if !listOnScreen && !sheetOpen}
      <button type="button" class="fab" aria-label="Show ingredients" onclick={() => (sheetOpen = true)}
        in:scale={{ duration: 180, start: 0.6 }} out:scale={{ duration: 120, start: 0.6 }}>
        <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
          <path d="M4 6.5h2M4 12h2M4 17.5h2M9 6.5h11M9 12h11M9 17.5h11" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" />
        </svg>
      </button>
    {/if}
    {#if sheetOpen}
      <aside class="sheet" aria-label="Ingredients" bind:this={sheetEl} transition:fly={{ y: 320, duration: 220, opacity: 1 }}>
        {@render head(() => (sheetOpen = false))}{@render list()}
      </aside>
    {/if}
  {/if}
</div>
