<script type="ts">
  //import { Ingredient } from "../../types/IngredientTypes";
  export let ing; //: Ingredient;
  export let onChange; //: Function;

  import IngredientDisplay from "../ing/Ingredient.svelte";
  import IngredientNutrientQuery from "./IngredientNutrientQuery.svelte";
  import IngredientGramWeight from "./IngredientGramWeight.svelte";
  import { IconButton, Button } from "../../widgets/index";
  const NONE = 0;
  const NUTRIENT = 1;
  const WEIGHT = 2;
  const ALL = 3;

  import {
    inferNutrientForIngredient,
    inferGramWeightForIngredient,
  } from "./inferNutrition";

  let inferredNut: any = false;
  let inferredWeight: any = false;
  async function updateNutritionInference(text) {
    if (inferredNut != text) {
      inferredNut = text;
      await inferNutrientForIngredient(ing);
      ing = ing;
    }
  }
  async function updateWeightInference(amount, unit) {
    if (!amount || !unit) {
      return;
    }
    if (inferredWeight !== amount + unit) {
      inferredWeight = amount + unit;
      let amountUpdate = await inferGramWeightForIngredient(ing);
      if (amountUpdate) {
        ing.amount = {
          ...ing.amount,
          ...amountUpdate,
        };
      }
      ing = ing;
    }
  }

  $: ing?.text && updateNutritionInference(ing.text);
  $: ing?.amount && updateWeightInference(ing.amount.amount, ing.amount.unit);
  let mode = NONE;
</script>

{#if ing}
  <div class="row">
    <IngredientDisplay edit={false} {ing} />
    <span
      class="weightInfo"
      class:inferred={ing.amount.inferred_gramWeight && !ing.amount.gramWeight}
    >
      {#if ing.amount.gramWeight}
        {Math.round(ing.amount.gramWeight).toFixed(0)}g
      {:else if ing.amount.inferred_gramWeight}
        {Math.round(ing.amount.inferred_gramWeight).toFixed(0)}g(?)
      {:else}
        No weight
      {/if}
    </span>
    <span class="nutritionInfo">
      {#if ing.fdcId}
        N
      {:else if ing.inferred_fdcId}
        N?
      {:else}
        No Nutrient :(
      {/if}
    </span>
    <span class="toggles">
      <Button
        toggled={mode == NUTRIENT || mode == ALL}
        toggle={true}
        on:click={() => {
          if (mode == NONE) {
            mode = NUTRIENT;
          } else if (mode == NUTRIENT) {
            mode = NONE;
          } else if (mode == ALL) {
            mode = WEIGHT;
          } else {
            mode = ALL;
          }
        }}
      >
        N
      </Button>
      <Button
        toggled={mode == WEIGHT || mode == ALL}
        toggle={true}
        on:click={() => {
          if (mode == NONE) {
            mode = WEIGHT;
          } else if (mode == WEIGHT) {
            mode = NONE;
          } else if (mode == ALL) {
            mode = NUTRIENT;
          } else {
            mode = ALL;
          }
        }}
      >
        W
      </Button>
    </span>
  </div>
  <div class="row">
    {#if mode == NUTRIENT || mode == ALL}
      <IngredientNutrientQuery
        {ing}
        onSave={(i) => {
          Object.assign(ing, i);
          ing = ing;
          onChange(ing);
        }}
      />
    {/if}
  </div>
  <div class="row">
    {#if mode == WEIGHT || mode == ALL}
      <IngredientGramWeight
        {ing}
        onSave={(i) => {
          Object.assign(ing, i);
          ing = ing;
          onChange(ing);
        }}
      />
    {/if}
  </div>
{:else}
  No ingredient?
{/if}

<style>
  .row {
    display: flex;
    flex-direction: row;
  }

  .weightInfo {
    background-color: var(--accent-bg);
    color: var(--accent-fg);
    display: inline-block;
    height: var(--bar-height);
    width: var(--bar-width);
    padding: 5px;
  }
</style>
