<script>
  import Portion from "./Portion.svelte";
  import { nutrients, portions } from "../../stores/nutritionStores";
  import {
    Button,
    NumberUnitDisplay,
    AmountInput,
    Select,
  } from "../../widgets/index";
  import { scorePortion } from "../../utils/portionUtils";
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
    if (portion && portion.amount) {
      onChange({
        ...ing,
        amount: {
          ...ing.amount,
          gramWeight: count * portion.amount.gramWeight,
        },
      });
      lastOne.count = count;
      lastOne.id = portion.id;
    } else {
      console.log("No amount on", portion);
    }
  }
  $: if (portion && count && count != lastOne.count) {
    handleChange();
  }

  function getPortions($portions, fdcId) {
    portionScores = {};
    $portions.forEach((p) => {
      portionScores[p.id] = scorePortion(p, ing);
    });
    myPortions = [...$portions];
    myPortions.sort((a, b) => portionScores[b.id] - portionScores[a.id]);
    myPortions = myPortions;
  }
  let portionScores = {};
  let myPortions = [];
  $: getPortions($portions, ing.fdcId);
</script>

<NumberUnitDisplay value={ing.amount} />
=
<AmountInput bind:value={count} />
<Select bind:value={portion} on:blur={handleChange}>
  {#each myPortions as portion}
    <option value={portion}>
      ({portionScores[portion.id]}) <Portion {portion} />
    </option>
  {/each}
</Select>
{#if portion}
  Selected: {count} x
  {JSON.stringify(portion.amount?.gramWeight)} (id: {portion.id})
{/if}
