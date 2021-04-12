<script type="ts">
  export let optionHtml;
  export let selectedValue;
  export let original;
  export let hoverable = true;
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  let html = "";
  $: {
    html = optionHtml.replace(/(<\/?)option/g, "$1span");
  }
  import { onMount } from "svelte";
  let liEl;
  let value = original?.__value;
  $: updateValue(original);

  function updateValue(original) {
    value = original.__value;
  }
</script>

<li
  bind:this={liEl}
  on:click={() => dispatch("select", { value })}
  class:selected={selectedValue == value}
  class:hoverable
>
  {@html html}
  {#if hoverable}
    <i class:invisible={selectedValue != value} class="material-icons">
      check
    </i>
  {/if}
</li>

<style>
  .invisible {
    visibility: hidden;
  }
  li {
    list-style: none;
    background-color: var(--white);
    color: var(--black);
    padding: var(--inputPadding);
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  li > :global(span) {
    display: contents;
  }
  li.hoverable:hover {
    background-color: var(--medium-bg);
    color: var(--medium-fg);
  }
</style>
