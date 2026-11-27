<script>
  // The colours a recipe wears. Automatic by default -- Gourmet reads them off
  // the title, the categories and a few telling ingredients -- and otherwise
  // one of the same designed palettes, picked by name.
  import { Select, Option, Text } from "contain-css-svelte";
  import { palettes, automaticName, isPalette } from "../app/palettes.js";

  /** @type {{ recipe: object, value?: string, onchange: (name: string) => void }} */
  let { recipe, value = "", onchange } = $props();

  const automatic = $derived(automaticName(recipe));
  const chosen = $derived(isPalette(value) ? value : "");
  const shown = $derived(palettes.find((p) => p.name === (chosen || automatic))?.color ?? {});
</script>

<div class="palette-chooser">
  <span class="palette-swatch" aria-hidden="true"
    style="--swatch-bg: {shown.bg}; --swatch-accent: {shown.accent ?? shown.fg};"></span>
  <Select value={chosen} aria-label="Colours" onchange={(event) => onchange(event.currentTarget.value)}>
    <Option value="">Automatic ({automatic})</Option>
    {#each palettes as palette (palette.name)}
      <Option value={palette.name}>{palette.name}</Option>
    {/each}
  </Select>
</div>
{#if chosen}
  <p class="palette-note"><Text muted>This recipe keeps the {chosen} palette whatever it is called.</Text></p>
{:else}
  <p class="palette-note"><Text muted>Chosen from the recipe itself, and it changes as the recipe does.</Text></p>
{/if}
