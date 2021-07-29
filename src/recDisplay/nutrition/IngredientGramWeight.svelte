<script>
  import IngredientDensityEntry from "./IngredientDensityEntry.svelte";
  import EquivalentEntry from "./EquivalentEntry.svelte";
  export let ing;
  import Portion from "./Portion.svelte";
  import {
    getGramWeight,
    getML,
    getInAConversion,
  } from "../../utils/unitAmounts";
  import { nutrients, portions } from "../../stores/nutritionStores";
  import {
    Tabs,
    Tab,
    Button,
    IconButton,
    NumberUnitDisplay,
  } from "../../widgets/index";
  export let onSave = (i) => console.log("Save! ", i, "(but not really)");
  const gramsPerOunce = getInAConversion("g", "ounce");
  let ounceWeight;
  $: ounceWeight = ing.amount.gramWeight / gramsPerOunce;

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
  const GRAM = "gram";
  const OUNCE = "ounce";
  let manualMode = GRAM;
  $: id = ing.fdcId || ing.inferred_fdcId;
  $: maybeFetchDetails(id);

  function save() {
    console.log("Save!", ing);
    onSave(ing);
    return ing;
  }

  let userChangedMode = false;
  $: if (ing && !userChangedMode) {
    let inferredGW = getGramWeight(ing.amount);
    if (inferredGW && !inferredGW.isWeight) {
      console.log("Initial set to density", inferredGW);
      mode = DENSITY_MODE;
    } else {
      console.log("Initial set to equiv", inferredGW);
      mode = EQUIVALENT_MODE;
    }
  }

  function setMode(newMode) {
    userChangedMode = true;
    mode = newMode;
  }
</script>

<div>
  <Tabs>
    <Tab on:click={() => setMode(DENSITY_MODE)} active={mode == DENSITY_MODE}>
      By Density
    </Tab>
    <Tab
      on:click={() => setMode(EQUIVALENT_MODE)}
      active={mode == EQUIVALENT_MODE}
    >
      By Equivalent
    </Tab>
    <Tab
      on:click={() => setMode(MANUAL_ENTRY_MODE)}
      active={mode == MANUAL_ENTRY_MODE}
    >
      Enter weight manually
    </Tab>
  </Tabs>
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
    {#if manualMode == GRAM}
      <input type="number" bind:value={ing.amount.gramWeight} />
    {:else}
      <input
        type="number"
        value={ounceWeight}
        on:change={(e) => {
          let ounces = Number(e.target.value);
          ing.amount.gramWeight = ounces * gramsPerOunce;
        }}
      />
    {/if}
    <select bind:value={manualMode}>
      <option value={GRAM}>grams</option>
      <option value={OUNCE}>ounces</option>
    </select>
  {/if}
</div>
<div>
  GramWeight : {ing.amount.gramWeight || ing.amount.inferred_gramWeight}
</div>

<style>
  td {
    vertical-align: top;
  }
</style>
