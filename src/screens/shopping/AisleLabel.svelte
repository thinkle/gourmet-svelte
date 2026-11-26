<script>
  import AisleIcon from "./AisleIcon.svelte";
  import { aisleKind, aisleName } from "./aisleKinds.js";
  let { name, selected = false } = $props();
  const kind = $derived(aisleKind(name));
</script>

<span class={kind ? `aisle-label aisle-${kind}` : "aisle-label"}>
  {#if kind}<AisleIcon {kind} size={20} />{/if}
  <span>{#if selected}<span aria-hidden="true">✓&nbsp;</span>{/if}{aisleName(name)}</span>
</span>
