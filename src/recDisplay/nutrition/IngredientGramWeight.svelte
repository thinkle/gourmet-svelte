<script>
  import IngredientDensityEntry from "./IngredientDensityEntry.svelte";
  import EquivalentEntry from "./EquivalentEntry.svelte";
  export let ing;
  import Portion from "./Portion.svelte";
  import { getGramWeight, getML } from "../../utils/unitAmounts";
  import { nutrients, portions } from "../../stores/nutritionStores";
  import { Button, IconButton, NumberUnitDisplay } from "../../widgets/index";
  export let onSave = (i) => console.log("Save! ", i, "(but not really)");

  // Let's simplify...
  //
  // Amount -> Unit -> Ingredient (already exists)
  // -> We have volume. Set density to get weight (density mode)
  // -> We have weight. We already have weight (no change needed!)
  // -> We have nothing. Select unit equivalent to get weight.
  // -> We have nothing. Just enter in weight to get weight.
  const DENSITY_MODE = 1;
  const EQUIVALENT_MODE = 2;
  const MANUAL_ENTRY_MODE = 3;
  let mode = DENSITY_MODE;

  async function maybeFetchDetails(id) {
    if (!id) {
      console.log("No nutrient id?");
      return;
    }
    let nutrient = $nutrients[id];
    if (!nutrient) {
      console.log("No nutrient :(");
      return;
    }
    if (!nutrient.detailed) {
      console.log("Fetch those details");
      await nutrients.fetchDetails(nutrient);
    } else {
      console.log("Already got details!", nutrient);
    }
  }
  let id;
  $: id = ing.fdcId || ing.inferred_fdcId;
  $: maybeFetchDetails(id);

  function save() {
    console.log("Save!", ing);
    onSave(ing);
    return ing;
  }
</script>

<div>
  <Button
    on:click={() => (mode = DENSITY_MODE)}
    inactive={mode == DENSITY_MODE}
  >
    By Density
  </Button>
  <Button
    on:click={() => (mode = EQUIVALENT_MODE)}
    inactive={mode == EQUIVALENT_MODE}
  >
    By Equivalent
  </Button>
  <Button
    on:click={() => (mode = MANUAL_ENTRY_MODE)}
    inactive={mode == MANUAL_ENTRY_MODE}
  >
    Enter weight manually
  </Button>
  <IconButton icon="save" on:click={save} />

  {#if mode == DENSITY_MODE}
    <IngredientDensityEntry
      {ing}
      onChange={(i) => {
        ing = i;
      }}
    />
  {:else if mode == EQUIVALENT_MODE}
    <EquivalentEntry
      {ing}
      onChange={(i) => {
        ing = i;
      }}
    />
  {:else if mode == MANUAL_ENTRY_MODE}
    <NumberUnitDisplay value={ing.amount} /> is
    <input type="number" bind:value={ing.amount.gramWeight} /> grams.
  {/if}
</div>
<div>
  GramWeight : {ing.amount.gramWeight || ing.amount.inferred_gramWeight}
</div>

<style>
  div {
    border: 3px solid blue;
    padding: 12px;
  }
</style>
