<script>
  export let ing
  import NutritionLabel from './NutritionLabel.svelte';
  import {user} from '../../stores/userStore'
  import {getNutritionQuery,extractItems} from '../../utils/ingredientUtils';
  import {queryNutrientRequest, getNutrientInfoRequest} from '../../data/requests/'
  let items = [];
  let multiplier = 1;
  let lastIng = '';
  let lastSearch = '';
  let searchTerms = '';
  function syncSearch (ing) {
    console.log('syncSearch',ing)
    if (ing?.text && ing.text != lastIng) {
      items = extractItems(ing.text||'')
      searchTerms = getNutritionQuery(ing.text||'');
      lastIng = ing?.text
      doSearch();
    }
  }
  let queryResponse = {foods:[]};
  let nutrients = [];
  let chosenFood;
  let nutritionInfo;
  async function doSearch () {
    if (searchTerms != lastSearch) {
      console.log('Search!',searchTerms)
      queryResponse = await queryNutrientRequest.makeRequest({user:$user,params:{query:searchTerms}})
      lastSearch = searchTerms;
      console.log('RESPONSE:',queryResponse.foods)
      if (queryResponse?.foods?.length) {
        chosenFood = queryResponse.foods[0]
      }
    }
  }

  async function getInfo (food) {
    if (!food?.fdcId) {return}
    let response = await getNutrientInfoRequest.makeRequest(
      {user:$user,
        params: {id:`${food.fdcId}`}
      }
    );
    if (response) {
      nutritionInfo = response?.result
      console.log('Got info:',nutritionInfo)
      if (nutritionInfo?.foodPortions?.length) {
        portion = nutritionInfo.foodPortions[0];
      }
      if (nutritionInfo?.foodNutrients) {
        console.log('new nutrients')
        nutrients = nutritionInfo.foodNutrients;
      }
    }
  }
  let portion;
  $: if (portion && portion.gramWeight) {
    multiplier = portion.gramWeight / 100;
  }
  $: getInfo(chosenFood);
  $: syncSearch(ing)
</script>

<div>
  [Searching for: {JSON.stringify(items)}]
  <input bind:value={searchTerms} on:blur={doSearch}>
  {searchTerms}
  <h3>Info</h3>
  <h4>{nutritionInfo?.description}</h4>
  {nutritionInfo?.dataType} {nutritionInfo?.startDate}-{nutritionInfo?.endDate}

  {#if nutritionInfo?.foodPortions}
  <h5>Portions</h5>
      {#each nutritionInfo.foodPortions as portion}
      <li>{portion.portionDescription}
      ({portion.gramWeight})</li>
      {/each}
  {/if}
  {#if portion}
  Nutritional Info for {portion.portionDescription} ({portion.gramWeight}g)
  {/if}
  {#if nutritionInfo?.foodNutrients}
  {nutritionInfo.description}
  {#each [nutritionInfo] as nutritionInto (nutritionInfo.description)}
  <NutritionLabel key={nutritionInfo.description} {nutrients} {multiplier}/>
  {/each}
  <h5>Nutrients</h5>
  {#each nutritionInfo.foodNutrients as nutrient}
  <li>ID: {nutrient?.nutrient?.id}  {nutrient?.nutrient?.name}
   Amount {nutrient.amount}
   unit {nutrient?.nutrient?.unitName}
  {JSON.stringify(nutrient)}
  </li>
  {/each}
  {/if}
  {JSON.stringify(nutritionInfo)}
  <br>
  <h3>Responses</h3>
  {#if queryResponse && queryResponse.foods}
  {#each queryResponse.foods as food}
    <br>{food.description} {food.score} {food.dataType}
    
  {/each}
  {/if}
</div>

