<script type="ts">
  import { nutrients } from "../../stores/nutritionStores";
  import {
    inferNutrientForIngredient,
    inferGramWeightForIngredient,
  } from "./inferNutrition";
  import Ingredient from "../ing/Ingredient.svelte";
  import IngredientNutrition from "../nutrition/IngredientNutrition.svelte";
  export let ingredients = [];
  export let onChange;
  let flatIngredients = [];
  function flattenIngredients(ii, fresh = false) {
    if (fresh) {
      flatIngredients = [];
    }
    for (let i of ii) {
      if (i.ingredients) {
        flattenIngredients(i.ingredients);
      } else if (i.reference) {
        console.log("TODO: Implement recipes as ingredients... :(");
      } else {
        flatIngredients.push(i);
      }
    }
  }

  function inferWeights(ii) {
    ii.map(inferWeight);
  }
  function inferNutrients(ii) {
    ii.map(inferNutrient);
  }

  async function inferNutrient(i) {
    //setTimeout(async () => {
    let inferredInfo = await inferNutrientForIngredient(i);
    if (inferredInfo) {
      Object.assign(i, inferredInfo);
      flatIngredients = flatIngredients;
    }
    //}, 0);
  }

  async function inferWeight(i) {
    //setTimeout(async () => {
    if (i.amount.gramWeight || i.amount.inferred_gramWeight) {
      // ignore if we already have something set
      return;
    }
    let inferredInfo = await inferGramWeightForIngredient(i);
    if (inferredInfo) {
      console.log("Inferred", inferredInfo, "about", i);
      if (!i.amount) {
        i.amount = {};
      }
      Object.assign(i.amount, inferredInfo);
      flatIngredients = flatIngredients;
    } else {
      console.log("No inferring nothing about", i);
    }
    //}, 0);
  }

  $: processIngredients(ingredients);

  function processIngredients(ingredients) {
    flattenIngredients(ingredients, true);
    inferNutrients(flatIngredients);
    inferWeights(flatIngredients);
  }

  function crawlIngForNutrition() {
    $nutrients[ing.fdcId || ing.inferred_fdcId];
  }
</script>

<div>
  <h3>Nutritional Information</h3>
  <p>
    Nutritional Information for {flatIngredients.length} ingredients.
  </p>
  <ul>
    {#each flatIngredients as ing (ing.amount + ing.unit + ing.text)}
      <li>
        <br />IN: <IngredientNutrition {ing} {onChange} />
      </li>
    {/each}
  </ul>
</div>

<style>
</style>
