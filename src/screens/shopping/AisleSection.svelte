<script>
  import { Surface } from "contain-css-svelte";
  import AisleIcon from "./AisleIcon.svelte";
  import { aisleKind, aisleName } from "./aisleKinds.js";
  let { name, showHeading = true, children } = $props();
  const kind = $derived(aisleKind(name));
</script>

<section class={kind ? `shopping-aisle themed-aisle aisle-${kind}` : "shopping-aisle"}>
  {#if showHeading}
    {#if kind}
      <Surface as="header" class="aisle-heading" bg="var(--aisle-bg)" fg="var(--aisle-fg)">
        <AisleIcon {kind} />
        <h4>{aisleName(name)}</h4>
      </Surface>
    {:else}
      <h4>{aisleName(name)}</h4>
    {/if}
  {/if}
  {@render children?.()}
</section>
