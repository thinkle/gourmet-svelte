<script>
  // The head of the recipe page. A photo, if there is one, is shown at its own
  // shape: a wide one runs across the top of the page, a tall one stands beside
  // the title. The recipe's colour is the title band; below it the facts are
  // labelled (Prep, Cook, Makes ...) and the categories get a row of their own.
  import { Surface, Text } from "contain-css-svelte";
  import CategoryTag from "../../components/CategoryTag.svelte";
  import { fmtTime, stars, recipeRole } from "../../app/lib.js";
  let { recipe } = $props();

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
  const sources = $derived((recipe.sources ?? []).filter((s) => s?.name || s?.url));
  const cats = $derived(recipe.tidyCats.slice(0, 8));
  const hasFacts = $derived(Boolean(recipe.rating || times.length || yields.length));

  // The photo's own shape, learned when it loads; cropped only if extreme.
  let ratio = $state(1.5);
  const shown = $derived(Math.min(2.4, Math.max(0.7, ratio)));
  const portrait = $derived(ratio < 0.95);
  const onload = (e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) ratio = i.naturalWidth / i.naturalHeight; };
</script>

<header class="hero" class:portrait class:photo={recipe.photo} style="{recipeRole(recipe.color)} --ratio: {shown}">
  {#if recipe.photo}
    <figure><img src={recipe.photo} alt="" {onload} /></figure>
  {/if}
  <div class="info">
    <Surface colorRole="recipe" class="band"><h1>{recipe.title}</h1></Surface>
    {#if cats.length}
      <ul class="cats" aria-label="Categories">{#each cats as c}<li><CategoryTag name={c} /></li>{/each}</ul>
    {/if}
    {#if hasFacts}
      <dl class="facts">
        {#if recipe.rating}<div><dt>Rating</dt><dd class="stars">{stars(recipe.rating)}</dd></div>{/if}
        {#each times as t}<div><dt>{t.label}</dt><dd>{t.value}</dd></div>{/each}
        {#each yields as y}<div><dt>Makes</dt><dd>{y.amount ?? ""} {y.unit ?? ""}</dd></div>{/each}
      </dl>
    {/if}
    {#if sources.length}
      <p class="sources"><Text muted>From</Text>
        {#each sources as s, i}{#if i}, {/if}{#if s.url}<a href={s.url}>{s.name || s.url}</a>{:else}{s.name}{/if}{/each}
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
    width: 100%;
    aspect-ratio: var(--ratio);
    max-height: min(26rem, 50dvh);
    object-fit: cover;
    border-radius: 0.75rem;
    box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 0.18);
  }
  .info { display: grid; gap: 0.9rem; align-content: start; }
  .info :global(.band) {
    padding: 0.9rem 1.25rem 1rem;
    border-radius: 0.75rem;
    border-inline-start: 0.5rem solid color-mix(in oklab, var(--recipe-fg) 55%, transparent);
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
    color: var(--muted-fg, color-mix(in oklab, currentColor 60%, transparent));
  }
  dd { margin: 0; font-size: 1.1rem; font-weight: 500; }
  .stars { color: var(--recipe-color); letter-spacing: 0.1em; }
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
