<script>
 export let onRecipeClick
 import {flip} from 'svelte/animate'
 import {fade} from 'svelte/transition'
 import {registerBuild} from '../../stores/debug.js'; registerBuild(BUILD_MS);
 //import {recipeData,recipeActions,connected} from '../../stores/recipeData.js';
 import {connected,
        localRecipes,
        storedRecipes,
        recipeActions,
        recipeActionState,
        recipeActionGeneralState,
        pageInfo,
        recipePage,
        recipeState} from '../../stores/recipeStores.js';
 import SearchProgress from '../../widgets/SearchProgress.svelte';
 import Whisk from '../../widgets/WhiskLogo.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 import Recipe from './Recipe.svelte'
 import RecipeSummary from './RecipeSummary.svelte';
 import FancyInput from '../../widgets/PlainInput.svelte';
 import _ from 'lodash';

 function getAll () {
     if ($connected) {
         console.log('Fetch those recipes...');
         recipeActions.getRecipes({fields:['title','categories','sources','images'],initial:true});
     }
     else {
         console.log('No connection yet... holding off');
     }
 }
 
 let search = '';
 let searchInput = '';
 let updateSearchDebounced = _.debounce(val => {search = val}, 250)
 $: updateSearchDebounced(searchInput);
 let setInputValue = val => {searchInput = val};
 $: setInputValue(search); // In case the search is updated other than through the input.
 let limit = 15
 function getRecipes (page=0) {
     recipeActions.getRecipes({
         fields:['title','categories','sources','images'],
         limit,
         query:{fulltext:search},
         page,
     });
 }

 $: $connected && getRecipes(0,search,limit)

</script>
<div>
    <div class="searchBar" class:searching={$recipeActionGeneralState.querying}>
        Search: <FancyInput type="text" bind:value={searchInput}/>
        <span width="30px">
            {#if $recipeActionGeneralState.querying}<SearchProgress/>{/if}
        </span>
        <span class="count">
            {#if $pageInfo.count}
                Showing recipes
                {$pageInfo.currentPage}&ndash;{
                Math.max($pageInfo.currentPage+$recipePage.length)}
                {#if !$pageInfo.last}
                    of 
                    {$pageInfo.count}
                {/if}
            {:else}
                {#if $recipeActionGeneralState.querying}
                    Looking
                {:else if search}
                    No recipes
                {/if}
            {/if}
        </span>
        <IconButton
            invisible="{!$pageInfo.currentPage}"
            icon="navigate_before"
            on:click="{
                       getRecipes($pageInfo.prevPage)
                       }"
        />
        <IconButton
            invisible="{$pageInfo.last}"
            icon="navigate_next" on:click="{()=>{
                                           getRecipes($pageInfo.nextPage)
                                           }}"
        />
    </div>
    <table>
        {#each $recipePage as id,n (n)}
            <tr class='summary' in:fade="{{duration:200,delay:200}}" out:fade="{{duration:300}}">
                <RecipeSummary
                    onClick={()=>{opened=id;onRecipeClick(id)}}
                   recipe={$storedRecipes[id]}
                />
                <td>
                    {#if $localRecipes[id]}
                        <IconButton icon="fullscreen" on:click={()=>{onRecipeClick(id)}}/>
                    {/if}
                </td>
            </tr>
        {:else}
            <tr in:fade="{{delay:200,duration:800}}" out:fade="{{duration:300}}">
                <td>
                <div class="center">
                    <h2>
                        {#if search}
                            No results for "{search}"...
                        {:else}
                            No recipes yet? Maybe import some or create them!
                        {/if}
                    </h2>
                    <div class="center"><Whisk size="250" /></div>
                    {#if $connected}
                        <IconButton
                            icon="add"
                            on:click="{async ()=>onRecipeClick(await recipeActions.createRecipe().id)}">
                            Create a Recipe?
                        </IconButton>
                    {:else}
                        (We're still connecting...)
                    {/if}
                    <div>
                        <a href="broken">
                            Install the Chrome Plugin
                            to import recipes from
                            your favorite sites
                        </a>
                    </div>
                </div></td>
            </tr>
        {/each}
    </table>
</div>
<div>
</div>
<style>
 table {
     margin: auto; /* center  */
 }
 .center {
     display: flex;
     height: 100%;
     width: 100%;
     align-items: center;
     justify-content: center;
     text-align: center;
     margin: auto;
     flex-direction: column;
 }
 .changed {
     font-style: italic;
     color: purple;
 }
 .searchBar {
     display: flex;
     align-items: center;
 }
 .count {
     font-size: var(--small);
     width: 12rem;
     margin-left: 1em;
 }
 .searchBar.searching {
     cursor: busy;
 }
</style>
