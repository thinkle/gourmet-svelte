<script>
  // One recipe on the list: its title, its multiplier (editable), and a way to take it off.
  import { CircleButton, Text } from "contain-css-svelte";
  import AmountInput from "../../components/AmountInput.svelte";
  let { entry, onchange, onremove } = $props();

  // The multiplier is edited in place and saved once typing settles.
  let mult = $state(entry.mult);
  $effect(() => { mult = entry.mult; });
  let timer;
  function settle(next) {
    mult = next;
    clearTimeout(timer);
    if (next !== entry.mult) timer = setTimeout(() => onchange(next), 500);
  }
</script>

<div class="on-list">
  <AmountInput bind:value={() => mult, settle} label="Multiplier for {entry.title}" />
  <span class="title">{entry.title}{#if !entry.found} <Text muted>(not found)</Text>{/if}</span>
  <CircleButton aria-label="Take {entry.title} off the list" onclick={onremove}>×</CircleButton>
</div>
