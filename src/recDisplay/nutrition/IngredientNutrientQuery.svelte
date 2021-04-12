<script type="ts">
  export let ing; //: Ingredient;
  export let unitName;
  export let onSave;

  import { nutrientMatches, nutrients } from "../../stores/nutritionStores";
  import { Button, Bar, IconButton, Select } from "../../widgets/";
  //import { NutrientQueryResult, Nutrient } from "../../types/nutrientTypes";
  import NutrientDisplay from "./NutrientDisplay.svelte";
  import { Ingredient } from "../../types/ingredientTypes";

  //export let gramWeight = 100;
  let gramWeight = 100;
  $: gramWeight =
    ing.amount.gramWeight || ing.amount.inferred_gramWeight || 100;

  import NutritionLabel from "./NutritionLabel.svelte";
  import { user } from "../../stores/userStore";
  import { getNutritionQuery, extractItems } from "../../utils/ingredientUtils";
  import {
    queryNutrientRequest,
    getNutrientInfoRequest,
  } from "../../data/requests/";
  //let multiplier = gramWeight / 100;
  //$: multiplier = gramWeight / 100;
  let lastIng = "";
  let lastSearch = "";
  let searchTerms = "";
  function syncSearch(ing) {
    console.log("syncSearch", ing);
    if (ing?.text && ing.text != lastIng) {
      searchTerms = getNutritionQuery(ing.text || "");
      lastIng = ing?.text;
      doSearch();
    }
  }
  let queryResponse; // : NutrientQueryResult = { foods: [] };
  let nutrient; //: Nutrient | null;

  function doSearch() {
    nutrientMatches.search(searchTerms);
  }

  $: if (searchTerms) {
    console.log("Update queryResponse for ", searchTerms);
    queryResponse = $nutrientMatches[searchTerms];
    console.log(queryResponse);
  }

  $: if (!nutrient && queryResponse && queryResponse?.foods?.length) {
    nutrient = queryResponse.foods[0];
    ing.inferred_fdcId = nutrient.fdcId;
  }

  let page = 1;
  async function getMore() {
    await nutrientMatches.fetchMore(searchTerms);
    queryResponse = $nutrientMatches[searchTerms];
  }
  let portion;
  $: syncSearch(ing);

  $: if (nutrient) {
    ing.fdcId = nutrient.fdcId;
  }

  let showNutritionLookup = {};
</script>

<div>
  <Bar style="align-items:flex-end;">
    <label slot="left">
      <span>Query for USDA Nutrient Database: </span>
      <input bind:value={searchTerms} on:change={doSearch} />
    </label>
    <div slot="right">
      {#if queryResponse && queryResponse.foods}
        <Select bind:value={nutrient}>
          {#each queryResponse.foods as food}
            <option value={food}>
              <NutrientDisplay nutrient={food} />
            </option>
          {/each}
        </Select>
        <Button on:click={getMore}>Fetch more options...</Button>
      {/if}
      <IconButton
        icon="save"
        on:click={() => {
          if (onSave) {
            onSave({ ...ing, fdcId: nutrient?.fdcId });
          }
        }}
      />
    </div>
  </Bar>

  <h4>{nutrient?.description}</h4>
  {nutrient?.dataType}
  {nutrient?.startDate}-{nutrient?.endDate}

  {#if $nutrients[ing.fdcId || ing.inferred_fdcId]?.foodNutrients}
    <NutritionLabel
      unitName={unitName || gramWeight + "g"}
      key={$nutrients[ing.fdcId || ing.inferred_fdcId]?.description}
      nutrients={$nutrients[ing.fdcId || ing.inferred_fdcId]?.foodNutrients}
      multiplier={gramWeight / 100}
    />
  {/if}
</div>

<style>
  label {
    display: inline-flex;
    flex-direction: column;
  }
  label span {
    font-size: x-small;
    align-self: flex-start;
    justify-content: center;
  }
</style>
