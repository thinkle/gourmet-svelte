<script type="ts">
  import type { Ingredient } from "../../types/ingredientTypes";
  export let ing: Ingredient;
  export let unitName;
  export let onSave;
  import {
    queryUSDANutrients,
    queryMongoNutrients,
    queryLocalNutrients,
    QueryTypes,
  } from "../../data/nutritionData";
  import { nutrients } from "../../stores/nutritionStores";
  import { Button, Bar, IconButton, Select } from "../../widgets/";
  import type {
    NutrientQueryResult,
    Nutrient,
  } from "../../types/nutrientTypes";
  import NutrientDisplay from "./NutrientDisplay.svelte";
  import NutritionLabel from "./NutritionLabel.svelte";
  import { getNutritionQuery, extractItems } from "../../utils/ingredientUtils";
  import { sortQueryResultsForIngredient } from "./inferNutrition";

  let lastIng = "";

  let nutrient: Nutrient | null;
  let allResponses: NutrientQueryResult[] = [];
  let sortedResults = [];
  let fetching = false;
  let queryType = QueryTypes.GENERAL;
  let lastSearch = {
    searchTerms: "",
    page: 1,
    queryType,
  };
  let searchTerms = "";

  function syncSearch(ing) {
    console.log("syncSearch", ing);
    if (ing?.text && ing.text != lastIng) {
      searchTerms = getNutritionQuery(ing.text || "");
      allResponses = [];
      queryType = QueryTypes.GENERAL;
      lastIng = ing?.text;
      doSearch();
    }
  }

  async function doSearch() {
    if (
      lastSearch.searchTerms == searchTerms &&
      lastSearch.queryType == queryType
    ) {
      page = lastSearch.page + 1;
    }
    fetching = true;
    try {
      console.log("New school USDA query!", searchTerms, page, queryType);
      var usdaResult = await queryUSDANutrients(searchTerms, page, queryType);
      lastSearch = { searchTerms, page, queryType };
    } catch (err) {
      fetching = false;
      throw err;
    }
    if (!usdaResult.foods.length && queryType == QueryTypes.GENERAL) {
      console.log("No results, try branded");
      queryType = QueryTypes.BRANDED;
      doSearch();
    }
    allResponses = [...allResponses, usdaResult];
    console.log("Updating responses", allResponses);
  }
  let userSet = false;

  function doSort(allResponses) {
    return sortQueryResultsForIngredient(ing, allResponses);
  }

  $: {
    sortedResults = doSort(allResponses);
  }

  $: if (!nutrient && sortedResults.length) {
    nutrient = sortedResults[0];
    ing.inferred_fdcId = nutrient.fdcId;
  }

  let page = 1;
  async function getMore() {
    //await nutrientMatches.fetchMore(searchTerms);
    //queryResponse = $nutrientMatches[searchTerms];
  }

  $: syncSearch(ing);

  $: if (nutrient) {
    ing.fdcId = nutrient.fdcId;
    $nutrients[nutrient.fdcId] = nutrient;
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
      {allResponses.length} queries
      {sortedResults.length} unique results
      {#if sortedResults.length}
        <Select bind:value={nutrient} update={sortedResults}>
          {#each sortedResults as food}
            <option value={food}>
              <NutrientDisplay nutrient={food} />
            </option>
          {/each}
        </Select>
        <Button on:click={doSearch}>Fetch more options...</Button>
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
      unitName={unitName ||
        (ing.amount?.gramWeight || ing.amount?.inferred_gramWeight || 100) +
          "g"}
      nutrients={$nutrients[ing.fdcId || ing.inferred_fdcId]?.foodNutrients}
      multiplier={(ing.amount?.gramWeight ||
        ing.amount?.inferred_gramWeight ||
        100) / 100}
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
