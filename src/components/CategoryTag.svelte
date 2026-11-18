<script>
  // A category as a Tag, coloured by Gourmet's colour code when the name
  // matches it, so a category always wears the same colour.
  import { Tag } from "contain-css-svelte";
  import { catColor } from "../app/lib.js";
  // `onclose`, when given, makes the tag removable (in the editor).
  let { name, onclose = null } = $props();
  const c = $derived(catColor(name));
</script>

{#if c}<Tag bg={c.bg} fg={c.fg} {onclose} closeLabel="Remove {name}">{name}</Tag>{:else}<Tag {onclose} closeLabel="Remove {name}">{name}</Tag>{/if}
