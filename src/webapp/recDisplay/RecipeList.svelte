<script>
 import {recipeData,recipeActions,connected} from '../../stores/recipeData.js';
 import {testRecs} from '../../common/mocks/recipes.js'
 import Status from '../../widgets/Status.svelte';
 import Recipe from './Recipe.svelte'
 import RecipeSummary from './RecipeSummary.svelte';
 import OpenRecipes from './OpenRecipes.svelte';
 import FancyInput from '../../widgets/PlainInput.svelte';
 import _ from 'lodash';
 let items = []

 $: {
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
 $: {
     if ($recipeData) {
         console.log('Got new data!',$recipeData);
         if ($recipeData.searchResults) {
             recipes = $recipeData.searchResults.map((v)=>$recipeData[v.id])
         }
         else {
             recipes = []
         }
     }
 }

 let syncingPromise

 let search = '';
 let searchInput = '';
 let updateSearchDebounced = _.debounce(val => {search = val}, 250)
 $: updateSearchDebounced(searchInput);
 let setInputValue = val => {searchInput = val};
 $: setInputValue(search); // In case the search is updated other than through the input.

 $: {if ($connected) {recipeActions.getRecipes({fields:['title','categories','sources','images'],limit:50,query:{fulltext:search}});}}
                            
</script>
<div>
    <h2>Recipes</h2>    
    <FancyInput type="text" bind:value={searchInput}/>
    <Status/>
    <div>
        <OpenRecipes recipes={open}/>
    </div>    
    <button on:click="{()=>syncingPromise=recipeActions.doSync()}">Sync with Server?</button>
    <button on:click="{()=>syncingPromise=recipeActions.doSync(true)}">Small Sync</button>
    {#if syncingPromise}
        {#await syncingPromise}
            Syncing...
        {:then json}
            Cool, done syncing! {JSON.stringify(json)}
        {:catch error}
            Failed :(
        {/await}
    {/if}
    <table>
        {#each recipes as recipe}
            <RecipeSummary onClick={()=>open=[...open,recipe]} recipe={recipe.current}/>
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
<style>
 .changed {font-style: italic; color: purple;}
</style>
