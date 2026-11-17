<script>
  // A category as a Tag, coloured by Gourmet's colour code when the name
  // matches it, so a category always wears the same colour.
  import { Tag } from "contain-css-svelte";
  import { catColor } from "../app/lib.js";
  let { name } = $props();
  const c = $derived(catColor(name));
</script>

{#if c}<Tag bg={c.bg} fg={c.fg}>{name}</Tag>{:else}<Tag>{name}</Tag>{/if}
