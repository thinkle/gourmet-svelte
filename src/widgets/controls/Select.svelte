<script>
  import { fly, fade } from "svelte/transition";
  import SelectOption from "./SelectOption.svelte";
  import { onMount } from "svelte";
  export let value;
  //import {Icon} from '../index';
  export let update;
  let selectElement;
  let menuEl;
  onMount(() => {
    populateItems();
  });

  $: if (update && selectElement) {
    populateItems();
  }

  function populateItems() {
    items = [];
    for (let i = 0; i < selectElement.children.length; i++) {
      let clone = selectElement.children[i].cloneNode(true);
      //menuEl.appendChild(clone);
      //clone.outerHTML = clone.outerHTML.replace(/(<\/?)option/g, "$1li");
      items = [
        ...items,
        { html: clone.outerHTML, original: selectElement.children[i] },
      ];
    }
  }

  let items = [{ html: "", original: {} }];
  let show = false;
  const dummyVal = "DucksFlyTogether";
</script>

<div class="select">
  <div
    class="current"
    on:click={() => {
      show = !show;
    }}
  >
    {#each items.filter((i) => i.original.__value == value) as item, n}
      <SelectOption
        selectedValue={dummyVal}
        optionHtml={item.html}
        original={item.original}
        hoverable={false}
      />
    {:else}
      <SelectOption
        selectedValue={dummyVal}
        hoverable={false}
        optionHtml={"<option>-</option>"}
        original={{ __value: null }}
      />
    {/each}
    <i class="material-icons"> expand_more </i>
  </div>
  {#if show}
    <ul in:fly={{ x: 0, y: -10 }} out:fade>
      {#each items as item, n}
        <SelectOption
          key={item.html}
          selectedValue={value}
          optionHtml={item.html}
          original={item.original}
          on:select={(e) => {
            value = e.detail.value;
            show = false;
            setTimeout(() => {
              selectElement.dispatchEvent(new Event("change"));
              selectElement.dispatchEvent(new Event("blur"));
            }, 200);
          }}
        />
      {/each}
    </ul>
  {/if}

  <select bind:value bind:this={selectElement} on:change on:blur>
    <slot />
  </select>
</div>

<style>
  .current {
    display: inline-flex;
    align-content: center;
    justify-content: center;
    border-radius: var(--inputRadius);
    border: var(--inputBorder);
  }
  ul {
    display: inline-flex;
    flex-direction: column;
    position: absolute;
    z-index: 99;
    top: var(--bar-height);
    left: 0;
    border: var(--inputBorder);
    border-radius: 0px 0px var(--inputRadius) var(--inputRadius);
  }
  ul > :global(li) {
    list-style: none;
    background-color: white;
  }
  select {
    display: none;
  }
  .select {
    position: relative;
  }
</style>
