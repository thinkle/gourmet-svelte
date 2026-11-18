<script>
  // One open recipe. The ingredient list must never be out of reach.
  // Wide: ingredients and text side by side, each scrolling on its own.
  // Phone: one column that reads top to bottom; once the ingredients have
  // scrolled away, a floating button brings them back as a sheet over the
  // lower part of the screen, wherever you are in the text.
  import { tick, untrack } from "svelte";
  import { fly, scale } from "svelte/transition";
  import { Button, SplitPane, Text } from "contain-css-svelte";
  import AmountInput from "../../components/AmountInput.svelte";
  import Ingredients from "./Ingredients.svelte";
  import RecipeHero from "./RecipeHero.svelte";
  import RecipeEditor from "./RecipeEditor.svelte";
  import { markIngredients, recipeRole } from "../../app/lib.js";
  import { bodyHtml, scaleAmounts } from "../../app/recipeText.js";
  import { countables, nounFor } from "../../app/countable.js";
  import { shopping, addRecipe } from "../../app/shopping.svelte.js";
  import { refFor, isRef } from "../../app/shoppingList.js";
  import { floatToFrac } from "../../utils/numbers.js";
  import { RecipeEdit } from "../../app/editState.svelte.js";
  /**
     recipe       the screen's prepared copy (for showing)
     stored       the stored record to edit (the raw row; a blank one for a new recipe)
     startEditing open straight into edit mode (a new recipe)
  */
  let { recipe, stored, startEditing = false, suggestions = [], data, onsaved, ondeleted, onclose, ondirty } = $props();

  // Edit mode, in place: the editor replaces the view in this same tab.
  let edit = $state(null);
  const beginEdit = () => (edit = new RecipeEdit(stored(), { data }));
  if (untrack(() => startEditing)) beginEdit();
  $effect(() => ondirty?.(Boolean(edit?.dirty)));
  function endEdit() {
    edit = null;
    // A new recipe never saved has nothing to show: close its tab.
    if (startEditing && recipe.id == null) onclose?.();
  }

  let mult = $state(1);
  // How many times this recipe is on the shopping list already (0 if not).
  const onList = $derived(shopping.rec?.ingredients?.find((i) => isRef(i) && i.reference === refFor(recipe))?.amount?.amount ?? 0);
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

  // <amount> in the text scales with the multiplier, like the ingredient list.
  const blocks = $derived((recipe.text ?? []).map((t) => ({ header: t.header, html: markIngredients(scaleAmounts(bodyHtml(t.body), mult), recipe.ingredients) })));
  const count = $derived(recipe.flat.length);
  // Scale to a yield: "for 30 empanadas" is the same multiplier as "x 1 1/4".
  // ...or "for 4 eggs": the whole things in the recipe, counted.
  const countRows = $derived(countables(recipe));
  const yieldRows = $derived((recipe.yields ?? []).map((y) => ({ unit: y?.unit ?? "", base: Number(y?.amount) })).filter((y) => y.base > 0));

  // Keep the marked-up mentions in the text in step with `active`.
  $effect(() => {
    const now = active;
    void blocks; // the text is redrawn when the multiplier changes
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
    <AmountInput bind:value={mult} label="Multiply the recipe by" />
    {#each yieldRows as y}
      <span class="scale-to">Makes
        <AmountInput times={false} unit={y.unit} label="Scale the recipe to this many {y.unit || 'servings'}"
          bind:value={() => y.base * mult, (v) => (mult = v / y.base)} />
      </span>
    {/each}
    {#each countRows as c}
      <span class="scale-to">With
        <AmountInput times={false} whole unit={nounFor(c, c.base * mult)} label="Scale the recipe to this many {c.many}"
          bind:value={() => c.base * mult, (v) => (mult = v / c.base)} />
      </span>
    {/each}
    {#if !onclose}
      <Button onclick={() => addRecipe(recipe, mult)}>Add to shopping list</Button>
      {#if onList}<Text muted>On the list ×{floatToFrac(onList)}</Text>{/if}
    {/if}
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

{#if edit}
  <RecipeEditor {edit} color={recipe.color} {suggestions}
    onsaved={(row) => { onsaved?.(row); edit = null; }}
    onclose={endEdit}
    ondeleted={(row) => { edit = null; ondeleted?.(row); }} />
{:else}
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
          <p class="recipe-actions"><Button onclick={beginEdit}>Edit</Button></p>
          <RecipeHero {recipe} {mult} />
          {@render prose()}
        </article>
      {/snippet}
    </SplitPane>
  {:else}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
    <article class="pane column" class:sheet-up={sheetOpen} bind:this={textEl} onclick={pickMention}>
      <p class="recipe-actions"><Button onclick={beginEdit}>Edit</Button></p>
      <RecipeHero {recipe} {mult} />
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
{/if}
