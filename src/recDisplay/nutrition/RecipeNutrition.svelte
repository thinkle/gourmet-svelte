<script type="ts">
  import pluralize from "pluralize";
  import { Button } from "../../widgets/";
  import { nutrients } from "../../stores/nutritionStores";
  import type { Ingredient } from "../../types/IngredientTypes";
  export let yields = [];
  import {
    inferNutrientForIngredient,
    inferGramWeightForIngredient,
  } from "./inferNutrition";
  import NutritionLabel from "../nutrition/NutritionLabel.svelte";

  import IngredientNutrition from "../nutrition/IngredientNutrition.svelte";
  export let ingredients = [];
  export let onChange;
  export let multiplier = 1;
  let defaultYield = {
    unit: "recipe",
    amount: 1,
  };
  $: multiplier = 1 / defaultYield.amount;
  $: unitName = `1 ${defaultYield.unit}`;
  $: if (yields.length) {
    defaultYield = yields[0];
  }
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

  function scaleForGramWeight(nutrient, gramWeight) {
    let foodNutrients = nutrient.foodNutrients.map((n) => {
      let amount = n.amount || n.value || 0;
      let id = n.nutrientId || n?.nutrient?.id;
      amount *= gramWeight / 100;
      return {
        nutrientId: id,
        value: amount,
        nutrientName: n.nutrientName || n.nutrient?.name,
        nutrient: n.nutrient,
      };
    });
    return {
      ...nutrient,
      foodNutrients,
    };
  }
  function addToNutrient(nutrient, aggregateNutrient) {
    let sourceNutrients = nutrient.foodNutrients;
    let targetNutrients = aggregateNutrient.foodNutrients;
    for (let n of sourceNutrients) {
      let target = targetNutrients.find((tn) => tn.nutrientId == n.nutrientId);
      if (target) {
        if (n.value) {
          target.value += n.value;
        } else {
          // console.log("No value for", n, nutrient);
        }
      } else if (n.value) {
        targetNutrients.push(n);
      } else {
        // console.log("No value for new nutrient", n, nutrient);
      }
    }
    return aggregateNutrient;
  }

  function aggregateNutrients(ings: Ingredient[], updateCount = 0) {
    console.log("aggregate!", updateCount, ings);
    let aggregateNutrient = {
      foodNutrients: [],
    };
    for (let ing of ings) {
      if (
        (ing.fdcId || ing.inferred_fdcId) &&
        (ing.amount.gramWeight || ing.amount.inferred_gramWeight)
      ) {
        let nutrient = $nutrients[ing.fdcId || ing.inferred_fdcId];
        if (nutrient) {
          let scaledNutrient = scaleForGramWeight(
            nutrient,
            ing.amount.gramWeight || ing.amount.inferred_gramWeight
          );
          //console.log("aggregate: Add", ing, "nutrition", scaledNutrient);
          addToNutrient(scaledNutrient, aggregateNutrient);
        } else {
          console.log("aggregate: We are missing nutrient?", ing);
        }
      }
    }
    console.log("Done aggregating", aggregateNutrient.foodNutrients);
    return aggregateNutrient.foodNutrients;
  }

  let updateCount = 0; // for reactive label
</script>

<div>
  <h3>Nutritional Information</h3>
  By {#each yields as yld}
    <Button on:click={() => (defaultYield = yld)}
      >{pluralize(yld.unit, 1)}</Button
    >
  {/each}
  <Button on:click={() => (defaultYield = { unit: "recipe", amount: 1 })}>
    Recipe
  </Button>

  <NutritionLabel
    nutrients={aggregateNutrients(flatIngredients, updateCount)}
    {multiplier}
    {unitName}
    baseUnit={{
      amount: 1,
      unit: "recipe",
    }}
  />
  <p>
    Nutritional Information for {flatIngredients.length}
    {pluralize("ingredients", flatIngredients.length)}.
  </p>
  <ul>
    {#each flatIngredients as ing (ing.amount + ing.unit + ing.text)}
      <li>
        <br /><IngredientNutrition
          {ing}
          onChange={function () {
            updateCount += 1;
            onChange(...arguments);
          }}
        />
      </li>
    {/each}
  </ul>
</div>

<style>
</style>
