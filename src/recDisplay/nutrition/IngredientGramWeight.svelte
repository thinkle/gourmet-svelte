<script>

  export let ing;
  import Portion from './Portion.svelte';
  import {getNutritionQuery,extractItems} from '../../utils/ingredientUtils';
  import {queryNutrientRequest, getNutrientInfoRequest} from '../../data/requests/'
  import {user} from '../../stores/userStore'
  import {getGramWeight} from '../../utils/unitAmounts'
  import {nutrients,portions} from '../../stores/nutritionStores'
  let inferenceInfo
  let density = 1;

  $: checkWeight(ing);
  export let onChange

  $: if (inferenceInfo && density != inferenceInfo?.density) {
    checkWeight(ing);
  }

  function checkWeight (ing) {
    if (ing?.amount?.gramWeight) {
      inferenceInfo = null;
      return;
    } else {
      inferenceInfo = getGramWeight(ing.amount, density);
      //ing.inferred_gramWeight = inferenceInfo.gramWeight;
      console.log('Assigning inferred gramWeight',
          inferenceInfo
        )
        if (onChange && inferenceInfo.gramWeight != ing.inferred_gramWeight) {
          onChange(
            {...ing,
            inferred_gramWeight:inferenceInfo.gramWeight}
          );
        }      
    }
  }

  $: nutrient = $nutrients[ing.fdcId||ing.inferred_fdcId]

  $: if (nutrient && (ing.fdcId || ing.inferred_fdcId) && inferenceInfo && !inferenceInfo.isWeight) {
    nutrients.fetchDetails(nutrient);
  }

  let densities = [];

  $: if (nutrient && !nutrient.detailed) {
    densities = [];
  }

  $: if (nutrient && nutrient.detailed && !inferenceInfo?.isWeight && nutrient.density) {
    console.log('I should do some work with all this information...',nutrient.foodPortions,'...');
    density = nutrient.density;
    densities = nutrient.densities;
  }

</script>

<div>
  {#if ing.gramWeight}
    Ingredient weight: <input type="number" bind:value={ing.gramWeight}> grams.
  {:else}
    Inferred weight:
    {ing.inferred_gramWeight}g
    <br>
    {JSON.stringify(inferenceInfo)}
    <br>
    {#if !inferenceInfo?.isWeight}
      Flour 
      <input 
      bind:value={density} 
      type="range" 
      min="0.5" 
      max="1.4"
      step="0.05"
      > Salt
      <input type="number" bind:value={density}>
    {/if}
    <hr>
    Nutrient: {ing.fdcId || ing.inferred_fdcId}
    <hr>
    <h4>Densities for this ingredient:</h4>
    {#each densities as portion}
      <Portion {portion}/>
    {/each}
    <h4>Other portions for this ingredient:</h4>
    {#each $portions as portion}
      {#if portion.fdcId==nutrient.fdcId && densities.indexOf(portion)==-1}
        <Portion {portion}/>
      {/if}
    {/each}
    <h4>All densities for other ingredients...:</h4>
    {#each $portions as portion}
      {#if portion?.amount?.density && portion.fdcId!=nutrient.fdcId}
        <Portion {portion}/>
      {/if}
    {/each}
    <h4>All portions for all ingredients...:</h4>
    {#each $portions as portion}
      {#if !portion?.amount?.density && portion.cdcId!=nutrient.fdcId}
        <Portion {portion}/>
      {/if}
    {/each}
  {/if}
</div>

<style>
  div {
    border: 3px solid blue;
    padding: 12px;
  }
</style>