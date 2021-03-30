<script>
  import {nutrientMatches,nutrients} from '../../stores/nutritionStores';
  import {Button} from '../../widgets/'
  export let ing
  //export let gramWeight = 100;
  let gramWeight = 100;
  $: gramWeight = ing.gramWeight || ing.inferred_gramWeight || 100
  export let unitName;
  import NutritionLabel from './NutritionLabel.svelte';
  import {user} from '../../stores/userStore'
  import {getNutritionQuery,extractItems} from '../../utils/ingredientUtils';
  import {queryNutrientRequest, getNutrientInfoRequest} from '../../data/requests/'
  //let multiplier = gramWeight / 100;
  //$: multiplier = gramWeight / 100;
  let lastIng = '';
  let lastSearch = '';
  let searchTerms = '';
  function syncSearch (ing) {
    console.log('syncSearch',ing)
    if (ing?.text && ing.text != lastIng) {
      searchTerms = getNutritionQuery(ing.text||'');
      lastIng = ing?.text
      doSearch();
    }
  }
  let queryResponse = {foods:[]};
  let nutrient;

  function doSearch () {
    nutrientMatches.search(searchTerms);
  }

  $: if (searchTerms) {
    console.log('Update queryResponse for ',searchTerms)
    queryResponse = $nutrientMatches[searchTerms];
    console.log(queryResponse);
  }
  
  $: if (!nutrient && queryResponse && queryResponse?.foods?.length) {
    nutrient = queryResponse.foods[0];
    ing.inferred_fdcId = nutrient.fdcId;
  }    

  let page = 1;
  async function getMore () {
    page += 1;
    let nextQueryResponse = await queryNutrientRequest.makeRequest({user:$user,params:{query:searchTerms,page}})
    queryResponse.foods = [...queryResponse.foods,...nextQueryResponse.foods]
  }
  let portion;
  $: syncSearch(ing)

  $: if (nutrient) {
    ing.fdcId = nutrient.fdcId
  }

  let showNutritionLookup = {}
</script>

<div>
  <input bind:value={searchTerms} on:change={doSearch}>
  {#if queryResponse && queryResponse.foods}
  <select bind:value={nutrient}>
    {#each queryResponse.foods as food}
    <option value={food}>{food.description} ({food.dataType})</option>
    {/each}
  </select>
  <Button on:click={getMore}>Fetch more options...</Button>
  {/if}

  <h3>Info</h3>
  SELECTED <pre>{JSON.stringify(nutrient)}</pre>
  <h4>{nutrient?.description}</h4>
  {nutrient?.dataType} {nutrient?.startDate}-{nutrient?.endDate}

  <!-- {#if nutritionInfo?.foodPortions} -->
  <!-- <h5>Portions</h5>
      {#each nutritionInfo.foodPortions as portion}
      <li>{portion.portionDescription}
      ({portion.gramWeight})</li>
      {/each}
  {/if}
  {#if portion} -->
  <!-- Nutritional Info for {portion.portionDescription} ({portion.gramWeight}g)
  {/if} -->
  <!-- {#if nutrient?.foodNutrients}
  {nutrient?.description} -->
  <!-- {#each [nutrient] as nutritionInfo (nutritionInfo.description)} -->
  {#if $nutrients[ing.fdcId||ing.inferred_fdcId]?.foodNutrients}
  <NutritionLabel 
    unitName={unitName||gramWeight+'g'} 
    key={$nutrients[ing.fdcId||ing.inferred_fdcId]?.description} 
    nutrients={$nutrients[ing.fdcId||ing.inferred_fdcId]?.foodNutrients} 
    multiplier={gramWeight/100}
    />
    {/if}
  <!-- {/each} -->
  <!-- {/if} -->
</div>
  <!-- <h5>Nutrients</h5>
  
  {/if}
  <br>
  <h3>Responses</h3>
  Show=>{JSON.stringify(showNutritionLookup)}
  {#if queryResponse && queryResponse.foods}
  {#each queryResponse.foods as food}
    <br>{food.description} {food.score} {food.dataType}
    <div>
      <button on:click={()=>showNutritionLookup[food.fdcId]=!showNutritionLookup[food.fdcId]}>
         Show nutrition
      </button>
      <button on:click={()=>nutrient=food}>
        Make main 
      </button>
        {#if showNutritionLookup[food.fdcId]}
          <NutritionLabel nutrients={food.foodNutrients}/>
        {/if}
    </div>
    
  {/each}
  {/if}
</div> -->

