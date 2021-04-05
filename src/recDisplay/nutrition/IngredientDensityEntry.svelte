<script type="ts">
  import { Ingredient } from "../../types/ingredientTypes";
  import DensityIndicator from "./DensityIndicator.svelte";
  export let ing: Ingredient;
  import { getML } from "../../utils/unitAmounts";
  import { scorePortion } from "../../utils/portionUtils";
  import { portions } from "../../stores/nutritionStores";
  import Portion from "./Portion.svelte";
  import { Select, Button, NumberUnitDisplay } from "../../widgets/index";
  export let density = 1;
  export let onChange;

  let mlAmount = {};
  $: mlAmount = {
    unit: "mL",
    amount: getML(ing.amount),
  };
  let gramAmount = {};
  $: gramAmount = {
    unit: "g",
    amount: mlAmount.amount * density,
  };
  let fdcId;
  $: fdcId = ing.fdcId || ing.inferred_fdcId;

  let myPortions = [];
  let portionScores = {};
  $: getPortions($portions, ing.fdcId);

  function getPortions($portions, id) {
    console.log("Get portions!", $portions);
    myPortions = $portions.filter((p) => p?.amount?.density);
    myPortions.forEach((p) => (portionScores[p.id] = scorePortion(p, ing)));
    myPortions.sort((a, b) => portionScores[b.id] - portionScores[a.id]);
    myPortions = myPortions;
    portionKey = myPortions.map((p) => p.id).join("-");
    console.log("Got portions!", myPortions);
  }
  let portionKey = "";
  let selectedPortion = null;
  let portionJustSelected = null;
  $: if (selectedPortion && selectedPortion != portionJustSelected) {
    console.log(
      "Set density!",
      selectedPortion.amount.density,
      selectedPortion
    );
    density = selectedPortion.amount.density;
    portionJustSelected = selectedPortion;
  }

  let initialDensity = density;
  $: if (density != initialDensity) {
    console.log("On change!", ing, density);
    onChange({
      ...ing,
      amount: {
        ...ing.amount,
        gramWeight: mlAmount.amount * density,
      },
    });
    initialDensity = density;
  }
</script>

<table>
  <tr>
    <th>Recipe Amount</th>
    <th>Volume in mL</th>
    <th>Weight in grams</th>
    <th>Density</th>
  </tr>
  <tr>
    <td><NumberUnitDisplay value={ing?.amount} tableMode={true} /></td>
    <td><NumberUnitDisplay value={mlAmount} /></td>
    <td><NumberUnitDisplay value={gramAmount} /></td>
    <td><DensityIndicator {density} /></td>
  </tr>
</table>

Density
<input
  on:change={() => {
    selectedPortion = null;
  }}
  bind:value={density}
  type="range"
  min="0.5"
  max="1.4"
  step="0.05"
/>
<input
  on:change={() => {
    selectedPortion = null;
  }}
  type="number"
  bind:value={density}
/>

Portion Selected : {selectedPortion?.id}
{#each [portionKey] as pk (portionKey)}
  <Select bind:value={selectedPortion} update={myPortions} key={pk}>
    <!-- on:blur={(e) => {
    console.log("select", e);
    if (e.target.value) {
      density = e.target.value;
    }
  }} -->
    <option value={null}>--</option>
    {#each myPortions as portion}
      <option value={portion}>
        ({portionScores[portion.id]}) <Portion {portion} />
      </option>
    {/each}
  </Select>
{/each}

<!-- 
    {#each densities as portion}
    <Portion {portion} />
    <Button
      on:click={() => {
        density = portion.amount.density;
      }}>Use</Button
    >
  {/each} -->
<style>  
</style>
