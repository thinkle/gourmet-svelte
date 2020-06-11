<script>
 export let onRecipeClick 
 export let onSelectionChange
 
 import {recipesOnList} from '../stores/shoppingStores.js';
 import {flip} from 'svelte/animate'
 import {fade} from 'svelte/transition'
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 //import {recipeData,recipeActions,connected} from '../stores/recipeData.js';
 import {connected,
        localRecipes,
        storedRecipes,
        recipeActions,
        recipeActionState,
        recipeActionGeneralState,
        pageInfo,
        recipePage,
        recipeState} from '../stores/recipeStores.js';
 import {
     Checkbox,
     PlainInput,
     SearchProgress,
     StatusIcon,
     WhiskLogo,
     IconButton} from '../widgets/';
 import Recipe from './rec/Recipe.svelte'
 import RecipeSummary from './rec/RecipeSummary.svelte';
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

 let selected = {}

 function updateSelected ( ) {
     let selectedIds = []
     for (let key in selected) {
         if (selected[key]) {
             selectedIds.push(Number(key));
         }
     }
     console.log('selection change!',selectedIds);
     onSelectionChange(selectedIds);
 }

 $: $connected && getRecipes(0,search,limit)

</script>
<div>
    <div class="searchBar" class:searching={$recipeActionGeneralState.querying}>
        Search: <PlainInput type="text" bind:value={searchInput}/>
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
    Shopping... {$recipesOnList.map((r)=>r.id)}
    <table>
        {#each $recipePage as id,n (`${n}${id}`)}
            <tr class='summary' in:fade|local="{{duration:200,delay:200}}" out:fade|local="{{duration:300}}">
                <td class="checkbox">
                    {#if onSelectionChange}
                        <Checkbox bind:checked="{selected[id]}" on:change="{updateSelected}"/>
                    {/if}
                </td>
                <RecipeSummary
                    onClick={()=>{onRecipeClick(id)}}
                   recipe={$storedRecipes[id]}
                />
                <td class="icons">
                    {#if $localRecipes[id]}
                        <IconButton icon="fullscreen" on:click={()=>{onRecipeClick(id)}}/>
                    {/if}
                    {#if $recipesOnList.find((r)=>r.id==id)}
                        <StatusIcon icon="shopping_cart"/>
                    {/if}
                </td>
            </tr>
        {:else}
            <tr in:fade|local="{{delay:200,duration:800}}" out:fade|local="{{duration:300}}">
                <td>
                    <div class="center">
                        <h2>
                            {#if search}
                                No results for "{search}"...
                            {:else}
                                No recipes yet? Maybe import some or create them!
                            {/if}
                        </h2>
                        <div class="center"><WhiskLogo size="250" /></div>
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
 table :global(td.title) {grid-area:title;}
 table :global(td.thumb) {grid-area:thumb;}
 table :global(td.categories) {grid-area:categories;}
 table :global(td.sources) {grid-area:sources;}
 table :global(td.times) {grid-area:times;}
 table :global(td.title) {grid-area:title;}
 @media (max-width: 620px) {
     table tr {
         margin-top: 1.5em;
         margin-bottom: 1.5em;
         display : grid;
         align-items: center;
         justify-items: left;
         grid-template-columns: 28px auto 150px;
         grid-template-areas:
             "checkbox   title      thumb"
             ".          categories thumb";
     }
     tr :global(td) {
         display: none;
     }
     tr td.checkbox,
     tr :global(td.title),
     tr :global(td.thumb),
     tr :global(td.categories)
     {
         display: table-cell;
     }

     tr :global(td.categories) {
         font-size: var(--small);
     }

 }
 @media (min-width: 621px) and (max-width: 850px) {
     table {
         margin-left: 2em;
         margin-right: 2em;
     }
     
     table tr {
         display : grid;
         align-items: center;
         justify-items: left;
         margin-top: 1em;
         margin-bottom: 1em;
         display : grid;
         grid-template-columns: 28px auto 200px 200px;
         grid-template-areas:
             "checkbox title      title      title   thumb"
             ".        categories categories sources thumb";
     }
     tr :global(td) {
         display: none;
     }
     tr :global(td.title),
     tr td.checkbox,
     tr :global(td.thumb),
     tr :global(td.categories),
     tr :global(td.sources) {
         display: table-cell;
     }
     tr :global(td.categories),
     tr :global(td.sources) {
         font-size: var(--small);
     }

 }
 @media (min-width: 1100px) {
     table {
         width: 1000px;
         margin-left: auto;
         margin-right: auto;
         border-collapse: separate;
         border-spacing: 2em 5px;
     }
     tr :global(td) {
         vertical-align: middle;
         margin-top: 1em;
         margin-bottom: 1em;
     }
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
