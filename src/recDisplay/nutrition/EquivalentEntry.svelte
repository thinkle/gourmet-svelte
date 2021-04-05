<script>
  import Portion from "./Portion.svelte";
  import { nutrients, portions } from "../../stores/nutritionStores";
  import {
    Button,
    NumberUnitDisplay,
    AmountInput,
    Select,
  } from "../../widgets/index";
  export let ing;
  let nutrient;
  $: nutrient = $nutrients[ing.fdcId || ing.inferred_fdcId];
  let count = ing?.amount?.amount || 1;
  export let onChange;
  let portion;

  let lastOne = {
    count: undefined,
    id: null,
  };
  function handleChange() {
    console.log("Equivalent change!");
    onChange({
      ...ing,
      amount: {
        ...ing.amount,
        gramWeight: count * portion.amount.gramWeight,
      },
    });
    lastOne.count = count;
    lastOne.id = portion.id;
  }
  $: if (portion && count && count != lastOne.count) {
    handleChange();
  }
</script>

<NumberUnitDisplay value={ing.amount} />
=
<AmountInput bind:value={count} />
<Select bind:value={portion} on:blur={handleChange}>
  {#each $portions as portion}
    {#if portion.fdcId == nutrient.fdcId && !portion?.amount?.density}
      <option value={portion}>
        <Portion {portion} />
      </option>
    {/if}
  {/each}
  <option>--Other items--</option>
  {#each $portions as portion}
    {#if portion.fdcId != nutrient.fdcId && !portion?.amount?.density}
      <option value={portion}>
        <Portion {portion} />
      </option>
    {/if}
  {/each}
</Select>
{#if portion}
  Selected: {count} x
  {JSON.stringify(portion.amount.gramWeight)} (id: {portion.id})
{/if}
