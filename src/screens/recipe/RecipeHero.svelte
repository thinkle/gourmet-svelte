<script>
  // The old Gourmet card, as the head of the recipe page: the recipe's colour
  // on top with the title, a quiet lower half with the facts, and the photo
  // (a circle) sitting across the seam.
  import { Surface, Text, Inline } from "contain-css-svelte";
  import CategoryTag from "../../components/CategoryTag.svelte";
  import { fmtTime, stars, recipeRole } from "../../app/lib.js";
  let { recipe } = $props();
  const time = $derived(fmtTime(recipe.seconds));
  const yields = $derived((recipe.yields ?? []).filter((y) => y?.amount || y?.unit));
  const sources = $derived((recipe.sources ?? []).filter((s) => s?.name || s?.url));
</script>

<header class="hero" class:photo={recipe.photo} style={recipeRole(recipe.color)}>
  <Surface colorRole="recipe" class="top">
    <h1>{recipe.title}</h1>
  </Surface>
  <div class="seam">{#if recipe.photo}<img class="portrait" src={recipe.photo} alt="" />{/if}</div>
  <Surface tier="surface-sunken" class="bottom">
    <Inline wrap>
      {#if recipe.rating}<span class="stars">{stars(recipe.rating)}</span>{/if}
      {#if time}<Text>{time}</Text>{/if}
      {#each yields as y}<Text>Makes {y.amount ?? ""} {y.unit ?? ""}</Text>{/each}
      {#each recipe.tidyCats.slice(0, 6) as c}<CategoryTag name={c} />{/each}
    </Inline>
    {#if sources.length}
      <p class="sources"><Text muted>From</Text>
        {#each sources as s, i}{#if i}, {/if}{#if s.url}<a href={s.url}>{s.name || s.url}</a>{:else}{s.name}{/if}{/each}
      </p>
    {/if}
  </Surface>
</header>

<style>
  .hero {
    --portrait: clamp(6rem, 26cqi, 12rem);
    position: relative;
    display: grid;
    border-radius: 0.75rem;
    overflow: hidden;
  }
  .hero :global(.top) {
    padding: 1rem 1.25rem 1.5rem;
    min-height: calc(var(--portrait) * 0.5 + 1.5rem);
    display: grid;
    align-content: end;
    justify-items: start;
    gap: 0.75rem;
  }
  .hero :global(.bottom) {
    padding: 1rem 1.25rem;
    min-height: calc(var(--portrait) * 0.5 + 1rem);
    display: grid;
    align-content: center;
    gap: 0.5rem;
  }
  .hero.photo :global(.top),
  .hero.photo :global(.bottom) {
    padding-inline-end: calc(var(--portrait) + 2.5rem);
  }
  h1 {
    margin: 0;
    font-family: var(--recipe-font-family);
    font-size: clamp(1.5rem, 1rem + 3cqi, 2.6rem);
    line-height: 1.15;
    text-wrap: balance;
  }
  .sources { margin: 0; }
  /* The photo sits across the seam between the two halves. */
  .seam { position: relative; height: 0; z-index: 1; }
  .portrait {
    position: absolute;
    inset-inline-end: 1.25rem;
    top: 0;
    translate: 0 -50%;
    width: var(--portrait);
    height: var(--portrait);
    border-radius: 50%;
    object-fit: cover;
    border: 0.3rem solid var(--recipe-fg);
    box-shadow: 0 0.25rem 1rem rgb(0 0 0 / 0.25);
  }
</style>
