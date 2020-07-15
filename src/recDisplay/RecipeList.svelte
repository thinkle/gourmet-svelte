<script>
 export let onRecipeClick 
 export let onSelectionChange=undefined;
 export let showShop = true;
 export let showEdit = true;
 export function reload () {
     getRecipes();
 }

 import SvelteInfiniteScroll from 'svelte-infinite-scroll'
 import scrollparent from 'scrollparent';
 let scrollingElement
 
 import {recipesOnList} from '../stores/shoppingStores.js';
 import {flip} from 'svelte/animate'
 import {fade,slide} from 'svelte/transition'
 import {registerBuild} from '../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
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
     Bar,
     Button,
     Checkbox,
     FullHeight,
     NavActions,
     PlainInput,
     SearchProgress,
     StatusIcon,
     WhiskLogo,
     JsonDebug,
     IconButton} from '../widgets/';
 import Recipe from './rec/Recipe.svelte'
 import RecipeSummary from './rec/RecipeSummary.svelte';
 import RecCard from './rec/RecCard.svelte';
 import _ from 'lodash';

 function getScrollingElement (node) {
     scrollingElement = scrollparent(node);
 }
 let recipeGetter
 let fetchedAll = false;
 async function getMore () {
     if (recipeGetter && !fetchedAll) {
         fetchedAll = await recipeGetter.more();
     }
 }

 
 let search = '';
 let sort;
 let searchInput = '';
 let updateSearchDebounced = _.debounce(val => {search = val}, 250)
 $: updateSearchDebounced(searchInput);
 let setInputValue = val => {searchInput = val};
 $: setInputValue(search); // In case the search is updated other than through the input.
 let limit = 30
 let lastSearch;
 
 async  function getRecipes (page=0) {
     fetchedAll = false;
     recipeGetter = await recipeActions.getInfiniteRecipes({
         fields:['title','categories','sources','images'],
         limit,
         query:{fulltext:search,deleted:0},
         sort,
         //page,
     });
     if (scrollingElement) {
         scrollingElement.scrollTop = 0;
     }
     if (recipeGetter.done) {
         fetchedAll = true;
     }
     // Note: if you call it recipeGetter.more() once below
     // automatically, you'll trigger a terrible bug
     

 }

 let selected = {}
 let areSelected=false;
 $: $recipePage && updateSelected();
 function updateSelected ( ) {
     if (!onSelectionChange) {return}
     let selectedIds = []
     for (let key in selected) {
         if (selected[key]) {
             if ($recipePage.includes(Number(key))) {
                 selectedIds.push(Number(key));
             } else {
                 delete selected[key]
             }
         }
     }
     onSelectionChange(selectedIds);
     if (selectedIds.length) {
         areSelected = true;
     } else {
         areSelected = false;
     }
 }

 $: $connected && getRecipes(0,search,limit,sort)

 //let alreadyFetched = []
 function validateRP (listOfIDs) {
     // this function should really go away
     //console.log('Updating recipePage...',listOfIDs,alreadyFetched);
     //let ids = [...new Set([...alreadyFetched,...listOfIDs])]
     //alreadyFetched = [...ids]
     let ids = [...new Set(listOfIDs)]
     ids.filter((id)=>id) // remove null
     return ids
 }

 let sizes = ['xs','sm','md','lg']
 let size = 'sm'
 function zoomIn () {
     let idx = sizes.indexOf(size)
     if (sizes.length > idx + 1) {
         size = sizes[idx+1]
     }
 }
 function zoomOut () {
     let idx = sizes.indexOf(size)
     if (idx > 0) {
         size = sizes[idx-1]
     }
 }

 let cardWidth
 let scrollContainerWidth
 let fillerCards = []
 $: calculateFiller(scrollContainerWidth,cardWidth,$recipePage);
 function calculateFiller () {
     fillerCards = []
     let cardsPerRow = Math.floor(scrollContainerWidth/cardWidth) || 1;
     // Plus one because we have the "info" card after the recipe w/ the scrolling feedback
     let lastRow = ($recipePage.length + 1) % cardsPerRow;
     if (lastRow) {
         for (let i=0; i<(cardsPerRow-lastRow); i++) {
             fillerCards = [...fillerCards,1]
         }
     } 
 }
 
</script>

<Bar growLeft="{true}"> 
    <div slot="left" class="searchBar" class:searching={$recipeActionGeneralState.querying}>
        <span style="align-self: flex-start" >Search:</span>
        <PlainInput bind:value={searchInput}/>
        <!-- Debug for when infinite scroll goes wonky  -->
        <!-- <Button on:click={getMore}>M</Button> -->
        <span width="30px">
            {#if $recipeActionGeneralState.querying}<SearchProgress/>{/if}
        </span>
        <NavActions menuProps="{{icon:"more_vert",anchorRight:true}}">
            <li>
                <IconButton
                    icon="sort_by_alpha"
                    bare="{true}"
                    toggle="{true}"
                    toggled="{sort&&sort=='title'}"
                    on:click="{()=>{if (sort=='title') {sort=undefined} else {sort='title'}}}"
                />
            </li>
            <li>
                <IconButton
                    bare="{true}"
                    icon="access_time"
                    toggle="{true}"
                    toggled="{sort&&sort.prop=='last_modified'}"
                    on:click="{()=>{if (sort && sort.prop=='last_modified') {
                              sort = undefined
                              } else {
                                  sort={prop:'last_modified',reverse:true}
                              }}}" />
            </li>
            <li>
                <IconButton
                    bare="{true}"
                    icon="zoom_in"
                    on:click="{zoomIn}"
                />
            </li>
            <li>
                <IconButton
                    bare="{true}"
                    icon="zoom_out"
                    on:click="{zoomOut}"
                />
            </li>
        </NavActions>
        <span class="count">
            {#if recipeGetter}{recipeGetter.count} recipes{/if}
            <!-- paginated interface -- probably we can delete it?
                 {#if $pageInfo.count}
                 Showing recipes
                 {$pageInfo.currentPage + 1}&ndash;{
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
                 {/if}  -->
        </span>
    </div>
    <div slot="right">
        <slot name="right"/>
    </div>
</Bar>

{#if areSelected}
    <div transition:slide>
        <Bar>
            <div class="slot" slot="left">
                <slot name="selectedLeft"/>
            </div>
            <div class="slot"  slot="right">
                <slot name="selectedRight"/>
            </div>
        </Bar>
    </div>
{/if}


<!-- <IconButton
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
     /> -->


<!-- <div> -->
<!--     Shopping... {$recipesOnList.map((r)=>r.id)} -->
<!-- <div>Results for {search}...</div> -->
<!-- </div> -->
{#if scrollingElement}
    <SvelteInfiniteScroll elementScroll="{scrollingElement}" threshold={250} on:loadMore={getMore} />
{/if}


<FullHeight scrolls={true}>
    <div class="cards" bind:clientWidth="{scrollContainerWidth}" use:getScrollingElement>        
        {#each $recipePage as id,n (id)}
            <div animate:flip="{{duration:300}}"
                 in:fade|local
                 class="card">
                <RecCard size="{size}" rec="{$storedRecipes[id]}"
                         hideCheck={!onSelectionChange}
                         bind:checked="{selected[id]}"
                         on:change="{updateSelected}"
                         onClick="{
                           (clickInfo)=>{
                              if (clickInfo.target=="title") {
                         onRecipeClick(id)
                         } else if (clickInfo.text) {
                         if (search) {
                         search+=' '+clickInfo.text
                         } else {
                         search = clickInfo.text;
                         }
                         }
                         }
                         }"
                >

                    <div class="slot" slot="left">
                        {#if $localRecipes[id]}
                            <StatusIcon icon="done"/>
                        {/if}
                        {#if $recipesOnList.find((r)=>r.id==id)}
                            <StatusIcon icon="shopping_cart"/>
                        {/if}
                    </div>
                    <div class="slot" slot="right">
                        {#if showShop}
                            {#if !$recipesOnList.find((r)=>r.id==id)}
                                <IconButton icon="add_shopping_cart" bare="true" on:click={()=>onRecipeClick(id,'shop')}/>
                            {/if}
                        {/if}
                        {#if showEdit}
                            <IconButton icon="edit" bare="true" on:click={()=>onRecipeClick(id,'edit')}/>
                        {/if}
                        <IconButton icon="read_more" bare="true" on:click={()=>onRecipeClick(id)}/>
                    </div>

                </RecCard>
            </div>
        {:else}
            <div class="center" in:fade out:fade>
                <h2>
                    {#if $recipeActionGeneralState.querying}
                        Fetching recipes...
                    {:else}
                        {#if search}
                            No results for "{search}"...
                        {:else}
                            No recipes yet? Maybe import some or create them!
                        {/if}
                    {/if}
                </h2>
                <div class="center"><WhiskLogo size="250" /></div>
                {#if $connected}
                    <IconButton
                        icon="add"
                        on:click="{()=>recipeActions.createRecipe().then((r)=>onRecipeClick(id))}">
                        Create a Recipe?
                    </IconButton>
                {:else}
                    (We're still connecting...)
                {/if}
                <div>
                    <a href="https://chrome.google.com/webstore/detail/gourmet-recipe-manager/bhneoidcckdhbjhmcpgbhhnapbbbojik?hl=en&authuser=0">
                        Install the Chrome Plugin
                        to import recipes from
                        your favorite sites
                    </a>
                </div>
            </div>
        {/each}
        {#if $recipePage.length}
            <div class="card" bind:clientWidth="{cardWidth}" in:fade out:fade>
                <RecCard size="{size}">
                    <div class="center">
                        {#if $recipeActionGeneralState.querying}
                            <p>Fetching more
                                {#if search}
                                    for &ldquo;{search}&rdquo;
                                {/if}
                            </p>
                        {:else if fetchedAll}
                            {#if search}
                                <p>That's all the results we have for &ldquo;{search}&rdquo;</p>
                            {:else}
                                <p>That's all folks!</p>
                            {/if}
                        {:else}
                            <p>Keep scrolling for more...</p>
                        {/if}
                    </div>
                </RecCard>
            </div>
            {#each fillerCards as i}
                <div class="card filler">
                    <RecCard size="{size}" rec="{{}}"
                    >
                    </RecCard>
                </div>
            {/each}
        {/if}
    </div>
    {#if DEV}{$recipePage.length} IDs: <JsonDebug data={$recipePage}/>{/if}
</FullHeight>
<style>
 .center {
     margin: auto;
 }
 .card.filler {
     visibility: hidden;
 }
 .cards {
     display: flex;
     flex-wrap: wrap;
     place-content: space-around;
 }
 
 .card {
     display: inline-block;
 }
 
 .center {
     display: flex;
     height: 100%;
     width: 100%;
     align-items: center;
     justify-content: center;
     text-align: center;
     /*margin: auto;*/
     flex-direction: column;
 }
 .changed {
     font-style: italic;
 }
 .searchBar {
     display: flex;
     align-items: center;
     flex-grow: 4;
 }
 .count {
     font-size: var(--small);
     margin-left: 1em;
 }
 .searchBar.searching {
     cursor: busy;
 }
 .center {
     display: flex;
     height: 100%;
     width: 100%;
     align-items: center;
     justify-content: center;
     text-align: center;
     flex-direction: column;
 }

</style>
