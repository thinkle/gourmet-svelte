<script>
 //import {recipeData,recipeActions,connected} from '../../stores/recipeData.js';
 import {localRecipes,storedRecipes,connected,recipeActions,recipePage,recipeState} from '../../stores/recipeStores.js';
 import {testRecs} from '../../common/mocks/recipes.js'
 import IconButton from '../../widgets/IconButton.svelte';
 import Status from '../../widgets/Status.svelte';
 import Recipe from './Recipe.svelte'
 import RecipeSummary from './RecipeSummary.svelte';
 import OpenRecipes from './OpenRecipes.svelte';
 import FancyInput from '../../widgets/PlainInput.svelte';
 import _ from 'lodash';
 let items = []

 function getAll () {
     if ($connected) {

         console.log('Fetch those recipes...');
         recipeActions.getRecipes({fields:['title','categories','sources','images'],initial:true});
     }
     else {
         console.log('No connection yet... holding off');
     }
 }
 
 export let open = [];
 let recipes = []
 /* $: {
  *     if ($recipeData) {
  *         console.log('Got new data!',$recipeData);
  *         if ($recipeData.searchResults) {
  *             recipes = $recipeData.searchResults.map((v)=>$recipeData[v.id])
  *         }
  *         else {
  *             recipes = []
  *         }
  *     }
  * } */

 let syncingPromise

 let search = '';
 let searchInput = '';
 let updateSearchDebounced = _.debounce(val => {search = val}, 250)
 $: updateSearchDebounced(searchInput);
 let setInputValue = val => {searchInput = val};
 $: setInputValue(search); // In case the search is updated other than through the input.

 $: {if ($connected) {recipeActions.getRecipes({fields:['title','categories','sources','images'],limit:10,query:{fulltext:search}});}}
                            let opener;
</script>
<div>
    <h2>New Store Recipes BUILD_TIME</h2>
    
    {#if $connected}
        Search: <FancyInput type="text" bind:value={searchInput}/>
        <br>
        <button on:click={()=>recipeActions.createRecipe(testRecs.empty)}>New Recipe</button>
    {/if}
    {#if $recipePage.length==0}
        <button on:click={getAll}>
            Get those recipes!
        </button>
    {/if}
    <Status/>
    <div>
        <OpenRecipes bind:this={opener} recipes={open}/>
    </div>    
    <button on:click="{()=>syncingPromise=recipeActions.doSync()}">Sync with Server?</button>
    <button on:click="{()=>syncingPromise=recipeActions.doSync(true)}">Small Sync</button>
    {#if syncingPromise}
        {#await syncingPromise}
            Syncing...
        {:then json}
            Cool, done syncing! {JSON.stringify(json)}
        {:catch error}
            Failed :( {console.log(error)} {error}
        {/await}
    {/if}
    Page: ${recipePage}
    <table>
        {#each $recipePage.slice(0,10) as id}
            <RecipeSummary
                onClick={()=>localRecipes.open(id)}
                recipe={$storedRecipes[id]}
            >
                <td>
                    {#if $localRecipes[id]}
                        <IconButton icon="fullscreen" on:click={opener.open(id)}/>
                    {/if}
                </td>
            </RecipeSummary>
        {:else}
            <div>
                No recipes yet? Maybe import some or create them!
                {#if $connected}<button on:click={()=>recipeActions.createRecipe(testRecs.empty)}>Create Your First Recipe</button>
                {:else}(Connecting...)
                {/if}

                <a href="broken">Install the Chrome Plugin to make it easy to import from webpages</a>
            </div>
        {/each}
    </table>
</div>
<div>
    DEBUG!
    LOCAL: {JSON.stringify($localRecipes)}
    StoredState: {JSON.stringify($recipeState)}
</div>
<style>
 .changed {font-style: italic; color: purple;}
</style>
