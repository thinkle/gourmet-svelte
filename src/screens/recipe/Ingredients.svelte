<script>
  import Ingredients from "./Ingredients.svelte";
  import { fmtAmount } from "../../app/lib.js";
  let { list, mult = 1, active = null, onpick } = $props();
  const amt = (a) => {
    if (!a || a.amount == null) return "";
    const hi = fmtAmount(a.amount * mult);
    const lo = a.rangeAmount ? fmtAmount(a.rangeAmount * mult) + "–" : "";
    return [lo + hi, a.unit].filter(Boolean).join(" ");
  };
</script>

<ul class="ingredients">
  {#each list ?? [] as ing}
    {#if ing?.ingredients}
      <li class="group">
        <h4>{ing.text}</h4>
        <Ingredients list={ing.ingredients} {mult} {active} {onpick} />
      </li>
    {:else if ing}
      <li>
        <button type="button" class="ingredient" class:active={active === ing.text}
          data-ingredient={ing.text} aria-pressed={active === ing.text} onclick={() => onpick?.(ing.text)}>
          <span class="amount">{amt(ing.amount)}</span>
          <span class="item">{ing.text}</span>
        </button>
      </li>
    {/if}
  {/each}
</ul>

<style>
  ul { list-style: none; margin: 0; padding: 0; }
  .group > h4 {
    margin: 1.1rem 0 0.25rem;
    font-family: var(--font-family);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    opacity: 0.7;
  }
  .ingredient {
    display: grid;
    grid-template-columns: minmax(4.75rem, max-content) 1fr;
    column-gap: 0.75rem;
    width: 100%;
    padding: 0.4rem 0.5rem;
    border: 0;
    border-radius: 0.375rem;
    background: none;
    color: inherit;
    font: inherit;
    text-align: start;
    line-height: 1.35;
    cursor: pointer;
    scroll-margin-block: 3.5rem 1rem;
  }
  .ingredient:hover { background: color-mix(in oklab, currentColor 7%, transparent); }
  .ingredient:focus-visible { outline: 2px solid currentColor; outline-offset: -2px; }
  .ingredient.active { background: var(--note-bg); color: var(--note-fg); }
  .amount { font-weight: 700; font-variant-numeric: tabular-nums; text-align: end; }
</style>
