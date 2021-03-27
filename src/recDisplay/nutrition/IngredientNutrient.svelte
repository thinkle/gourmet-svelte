<script>

  import {Button} from '../../widgets/'
  export let ing
  export let gramWeight = 100;
  export let unitName;
  import NutritionLabel from './NutritionLabel.svelte';
  import {user} from '../../stores/userStore'
  import {getNutritionQuery,extractItems} from '../../utils/ingredientUtils';
  import {queryNutrientRequest, getNutrientInfoRequest} from '../../data/requests/'
  let multiplier = gramWeight / 100;
  $: multiplier = gramWeight / 100;
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
  ing.nutrient;

  async function doSearch () {
    page = 1;
    if (searchTerms != lastSearch) {
      console.log('Search!',searchTerms)
      queryResponse = await queryNutrientRequest.makeRequest({user:$user,params:{query:searchTerms}})
      lastSearch = searchTerms;      
      console.log('RESPONSE:',queryResponse.foods)
      if (queryResponse?.foods?.length) {
        ing.nutrient = queryResponse.foods[0]
      }
    }
  }
  let page = 1;
  async function getMore () {
    page += 1;
    let nextQueryResponse = await queryNutrientRequest.makeRequest({user:$user,params:{query:searchTerms,page}})
    queryResponse.foods = [...queryResponse.foods,...nextQueryResponse.foods]
  }
  let portion;
  $: syncSearch(ing)
  let showNutritionLookup = {}
</script>

<div>
  <input bind:value={searchTerms} on:blur={doSearch}>
  <select bind:value={ing.nutrient}>
    {#each queryResponse.foods as food}
    <option value={food}>{food.description} ({food.dataType})</option>
    {/each}
  </select>
  <Button on:click={getMore}>Fetch more options...</Button>

  <h3>Info</h3>
  SELECTED <pre>{JSON.stringify(ing.nutrient)}</pre>
  <h4>{ing.nutrient?.description}</h4>
  {ing.nutrient?.dataType} {ing.nutrient?.startDate}-{ing.nutrient?.endDate}

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
  {#if ing.nutrient?.foodNutrients}
  {ing.nutrient?.description}
  {#each [ing.nutrient] as nutritionInfo (nutritionInfo.description)}
  <NutritionLabel 
    unitName={unitName||gramWeight+'g'} 
    key={nutritionInfo.description} 
    nutrients={nutritionInfo.foodNutrients} 
    {multiplier}
    />
  {/each}
  {/if}
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
      <button on:click={()=>ing.nutrient=food}>
        Make main 
      </button>
        {#if showNutritionLookup[food.fdcId]}
          <NutritionLabel nutrients={food.foodNutrients}/>
        {/if}
    </div>
    
  {/each}
  {/if}
</div> -->

