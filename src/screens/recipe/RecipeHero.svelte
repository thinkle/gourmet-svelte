<script>
  // The head of the recipe page. A photo, if there is one, is shown at its own
  // shape: a wide one runs across the top of the page, a tall one stands beside
  // the title. The recipe's colour is the title band; below it the facts are
  // labelled (Prep, Cook, Makes ...) and the categories get a row of their own.
  import { Button, Surface, Text } from "contain-css-svelte";
  import AmountInput from "../../components/AmountInput.svelte";
  import CategoryTag from "../../components/CategoryTag.svelte";
  import { fmtTime, stars, recipeRole, sourceItems } from "../../app/lib.js";
  import { floatToFrac } from "../../utils/numbers.js";
  // A yield scaled by the multiplier: "24 cookies" x 2 -> "48 cookies".
  const scaled = (n) => (Number(n) > 0 ? floatToFrac(Number(n) * mult) : (n ?? ""));
  let { recipe, mult = $bindable(1), onedit } = $props();

  // "preptime", "Cook time", "total" -> "Prep", "Cook", "Total"
  const label = (n) => {
    const s = (n ?? "").trim().replace(/[\s_-]*time$/i, "").trim();
    return s ? s[0].toUpperCase() + s.slice(1) : "Time";
  };
  const times = $derived(
    (recipe.times ?? [])
      .map((t) => ({ label: label(t.name), value: t.seconds ? fmtTime(t.seconds) : (t.text ?? "") }))
      .filter((t) => t.value),
  );
  const yields = $derived((recipe.yields ?? []).filter((y) => y?.amount || y?.unit));
  const sources = $derived(sourceItems(recipe));
  const cats = $derived(recipe.tidyCats.slice(0, 8));
  const hasFacts = $derived(Boolean(recipe.rating || times.length || yields.length));

  // The photo's own shape, learned when it loads; cropped only if extreme.
  let ratio = $state(1.5);
  let natural = $state(null); // the photo's own width in px: never shown larger than this
  const shown = $derived(Math.min(2.4, Math.max(0.7, ratio)));
  const portrait = $derived(ratio < 0.95);
  const onload = (e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) { ratio = i.naturalWidth / i.naturalHeight; natural = i.naturalWidth; } };
</script>

<header class="hero" class:portrait class:photo={recipe.photo} style="{recipeRole(recipe.color)} --ratio: {shown}{natural ? `; --natural: ${natural}px` : ''}">
  {#if recipe.photo}
    <figure><img src={recipe.photo} alt="" {onload} /></figure>
  {/if}
  <div class="info">
    <Surface colorRole="recipe" class="band">
      <h1>{recipe.title}</h1>
      {#if onedit}<Button class="band-action" onclick={onedit}>Edit</Button>{/if}
    </Surface>
    {#if cats.length}
      <ul class="cats" aria-label="Categories">{#each cats as c}<li><CategoryTag name={c} /></li>{/each}</ul>
    {/if}
    {#if hasFacts}
      <dl class="facts">
        {#if recipe.rating}<div><dt>Rating</dt><dd class="stars"><Text primary>{stars(recipe.rating)}</Text></dd></div>{/if}
        {#each times as t}<div><dt>{t.label}</dt><dd>{t.value}</dd></div>{/each}
        {#each yields as y}
          <div><dt>Makes</dt>
            <!-- A yield with a number scales the recipe: "for 30 empanadas" is x 1 1/4. -->
            <dd>{#if Number(y.amount) > 0}
              <AmountInput times={false} unit={y.unit ?? ""} label="Scale the recipe to this many {y.unit || 'servings'}"
                bind:value={() => Number(y.amount) * mult, (v) => (mult = v / Number(y.amount))} />
            {:else}{scaled(y.amount)} {y.unit ?? ""}{/if}</dd></div>
        {/each}
      </dl>
    {/if}
    {#if sources.length}
      <p class="sources"><Text muted>From</Text>
        <!-- The separator is an expression: a literal ", " here loses its
             trailing space to whitespace trimming at the block boundary. -->
        {#each sources as s, i}{#if i}{", "}{/if}{#if s.url}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>{:else}{s.label}{/if}{/each}
      </p>
    {/if}
  </div>
</header>

<style>
  .hero {
    container-type: inline-size;
    display: grid;
    gap: 1rem;
    margin-block-end: 1.5rem;
  }
  figure { margin: 0; }
  img {
    display: block;
    width: min(100%, var(--natural, 100%));
    aspect-ratio: var(--ratio);
    max-height: min(26rem, 50dvh);
    object-fit: cover;
    border-radius: 0.75rem;
    box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 0.18);
  }
  .info { display: grid; gap: 0.9rem; align-content: start; }
  /* Edit belongs to the recipe, so it rides in the title band, at the end of
     the title's own line, the way the app's own actions ride in the top bar. */
  .info :global(.band) {
    display: flex;
    align-items: start;
    gap: 1rem;
    padding: 0.9rem 1.25rem 1rem;
    border-radius: 0.75rem;
    border-inline-start: 0.5rem solid var(--recipe-accent);
  }
  h1 { flex: 1; min-width: 0; }
  /* Quiet until you point at it: the band's own colour, not a slab on top. */
  .info :global(.band-action) {
    flex: none;
    --button-bg: transparent;
    --button-fg: color-mix(in oklab, currentColor 72%, transparent);
    --button-border-color: transparent;
    --button-box-shadow: none;
    --button-hover-bg: color-mix(in oklab, currentColor 18%, transparent);
    --button-hover-fg: currentColor;
    --button-hover-filter: none;
  }
  h1 {
    margin: 0;
    font-family: var(--recipe-font-family);
    font-size: clamp(1.6rem, 1rem + 3cqi, 2.8rem);
    line-height: 1.15;
    text-wrap: balance;
  }
  .cats { display: flex; flex-wrap: wrap; gap: 0.4rem; margin: 0; padding: 0; list-style: none; }
  .facts {
    display: flex; flex-wrap: wrap; gap: 0.75rem 2rem;
    margin: 0; padding: 0.15rem 0 0.15rem 0.25rem;
  }
  .facts div { display: grid; gap: 0.1rem; }
  dt {
    font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted-text-fg);
  }
  dd { margin: 0; font-size: 1.1rem; font-weight: 500; }
  .stars { letter-spacing: 0.1em; }
  .sources { margin: 0; padding-inline-start: 0.25rem; }

  /* A tall photo stands beside the title when there is room. */
  @container (min-width: 40rem) {
    .portrait { grid-template-columns: minmax(12rem, 18rem) 1fr; align-items: start; }
    .portrait img { max-height: 30rem; }
  }
  /* Stacked and tall: don't let it swallow the screen. */
  @container (max-width: 39.99rem) {
    .portrait img { max-height: 20rem; }
  }
</style>
