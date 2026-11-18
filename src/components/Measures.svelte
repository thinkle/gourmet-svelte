<script>
  // All the measures of one ingredient: the primary one, then each alternate
  // in brackets, e.g. "2 sticks (225 g)". Everything is multiplied by `mult`.
  // Formatting lives in utils/formatMeasure.js.
  import { formatMeasures } from "../utils/formatMeasure.js";
  let { amount, altAmounts = [], mult = 1 } = $props();
  const parts = $derived(formatMeasures(amount, altAmounts, mult));
</script>

{#each parts as part, i}{#if i > 0}{" "}<span class="alt">({part})</span>{:else}<span class="first">{part}</span>{/if}{/each}

<style>
  .alt { font-weight: 400; opacity: 0.85; }
</style>
