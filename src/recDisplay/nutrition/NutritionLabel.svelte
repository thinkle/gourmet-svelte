<script>
  export let nutrients;
  export let multiplier=1;
  export let unitName;
  import {MACRO_RDI,NUTRIENTS_RDI,RDI_BY_NUTRIENT} from './rdi';
  $: console.log(nutrients)
  const KCAL = 1008; // kcal
  const UNSATFAT = 1293; // polyunsaturated fatty acids
  const CARBS = 2039; // total carbs
  const SUGAR = 2000; // sugars
  const CARBDIFF = 1005; // carbs by difference???
  let alreadyUsed = [];
  const MAIN = 0;
  const DET = 1;
  const ALL = 2;
  
  let detailLevel = MAIN
  const percentDV = {}

  function getNutrient (nameOrId) {
    let rdi = RDI_BY_NUTRIENT[nameOrId];
    return getNutrientAmountFromID(rdi?.id||nameOrId,nameOrId);
  }

  function getNutrientAmountFromID (id, name) {
    /* Nutrients can looks like...
    
    {
      nutrientId : id,
      value : ...,
      nutrientName : ...,
      unitName : ...,
    }
    OR
    {
      amount : amount,
      nutrient : {
        id : ...,
        name : ...,
      }
    }
    */
    let nut = nutrients.find((n) => n?.nutrient?.id == id||n?.nutrientId==id);
    alreadyUsed = [...alreadyUsed,id];
    let amount = nut?.amount || nut?.value || 0;
    if (RDI_BY_NUTRIENT[id]) {
      percentDV[id] = Math.round(100 * multiplier * amount / RDI_BY_NUTRIENT[id].RDI).toFixed()+'%'
      percentDV[name] = Math.round(100 * multiplier * amount / RDI_BY_NUTRIENT[id].RDI).toFixed()+'%'
      return `${Math.round(amount*multiplier)}${RDI_BY_NUTRIENT[id].unit}`     
    }
    console.log(id,'no RDI... amount is',amount)
    return (multiplier*amount).toFixed()
  }

 </script>

<div class="facts">
  <div class="cal">
    <div class="vertical">
      <b class="small">
        Amount per {unitName||''} 
        {#if unitName}({/if}{100*multiplier}g{#if unitName}){/if}
      </b>
      <b>Calories</b>
  </div>
    <b>
      {getNutrient(KCAL)}
    </b>
  </div>
  <div>
    <b>Total Fat</b>
    <div>{getNutrient('Fat')}</div>
    <b>{percentDV['Fat']}</b>
  </div>
  <div class="indent">
    <div>Saturated Fat</div>
    <div>{getNutrient('Saturated Fat')}</div>
    <b>{percentDV['Saturated Fat']}</b>

  </div>
  <div>
    <b>Cholesterol</b>
    <div>{getNutrient('Cholesterol')}</div>
    <b>{percentDV['Cholesterol']}</b>

  </div>
  <div>
    <b>Sodium</b>
    <div>{getNutrient('Sodium')}</div>
    <b>{percentDV['Sodium']}</b>

  </div>
  <div>
    <b>Total Carbohydrates</b>
    <div>{getNutrient('Carbohydrates')||getNutrient(CARBS)}</div>
    <b>{percentDV['Carbohydrates']}</b>

  </div>
  <div class="indent">
    <div>Dietary fiber</div>
    <div>{getNutrient('Dietary Fiber')}</div>
    <b>{percentDV['Dietary Fiber']}</b>
  </div>
  <div class="indent">
    <div>Total Sugars</div>
    <div>{getNutrient(SUGAR)}g</div>
    <div></div>
  </div>
  <div class="last">
    <b>Protein</b>
    <div>{getNutrient('Protein')}</div>
    <b>{percentDV['Protein']}</b>
  </div>
  {#if detailLevel==DET||detailLevel==ALL}
    {#each NUTRIENTS_RDI as nutrient}
      {#if percentDV[nutrient.nutrient]!='0%'}
      <div>
        <div>{nutrient.nutrient}</div>
        <div>{getNutrient(nutrient.nutrient)}</div>
        <div>{percentDV[nutrient.nutrient]}</div>
      </div>
      {/if}
    {/each}
  {/if}
  {#if detailLevel==ALL}
    {#each nutrients as nutrient}
      {#if alreadyUsed.indexOf(nutrient?.nutrient?.id||nutrient?.nutrientId)== -1
      && (nutrient?.amount||nutrient?.value)}
        <div>
          <div>
            {nutrient?.nutrient?.name||nutrient?.nutrientName}
            <br>{nutrient?.nutrient?.id||nutrient?.nutrientId}
          </div>
          <div>
            {nutrient.amount||nutrient.value}
            {nutrient?.nutrient?.unitName||nutrient?.unitName}
          </div>
          <div></div>
        </div>
      {/if}
    {/each}
  {/if}
  {#if detailLevel==MAIN}
    <div>
      <div>
        <span on:click={()=>detailLevel=DET}>Show more</span>
        <span on:click={()=>detailLevel=ALL}>Show all</span>

      </div>        
    </div>
  {:else if detailLevel==DET}
    <div>
      <div>
        <span on:click={()=>detailLevel=MAIN}>Show less</span>
        <span on:click={()=>detailLevel=ALL}>Show more</span>
      </div>        
    </div>
  {:else}
  <div>
    <div>
      <span on:click={()=>detailLevel=DET}>Show less</span>
      <span on:click={()=>detailLevel=MAIN}>Show less less</span>
    </div>        
  </div>
  {/if}
</div>

<style>
  .facts > .cal {
    font-size: 2rem;
    border-bottom-width: 10px;
    border-bottom: 10px solid black;
    align-items: flex-end;
  }
  .facts > .last {
    border-bottom: 10px solid black;
  }
  .cal > *:last-child {
    font-size: 3rem;
  }
  .indent > *:first-child {
    margin-left: 2rem;
  }
  .facts > div > *:nth-child(2) {
    margin-left: 1rem;
  }
  .facts > div {
    display: flex;
    flex-direction: row;
    padding: 4px;
    border-bottom: 1px solid #666;
  }
  .facts > div > *:last-child {
    margin-left: auto;
  }
  .vertical {
    display: flex;
    flex-direction: column;
  }
  .small {
    font-size: x-small;
  }
</style>
