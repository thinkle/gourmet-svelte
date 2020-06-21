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
 function getMore () {
     recipeGetter && recipeGetter.more();
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
     console.log('selection change!',selectedIds);
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
     console.log('Page is',ids)
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
</script>

<Bar growLeft="{true}"> 
    <div slot="left" class="searchBar" class:searching={$recipeActionGeneralState.querying}>
        Search: <PlainInput type="text" bind:value={searchInput}/>
        <!-- Debug for when infinite scroll goes wonky  -->
        <!-- <Button on:click={getMore}>M</Button> -->
        <span width="30px">
            {#if $recipeActionGeneralState.querying}<SearchProgress/>{/if}
        </span>
        <NavActions>
            <li>
                <IconButton
                    icon="sort_by_alpha"
                    toggle="{true}"
                    toggled="{sort&&sort=='title'}"
                    on:click="{()=>{if (sort=='title') {sort=undefined} else {sort='title'}}}"
                />
            </li>
            <li>
                <IconButton
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
                    icon="zoom_in"
                    on:click="{zoomIn}"
                />
            </li>
            <li>
                <IconButton
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
    <div class="cards" use:getScrollingElement>        
        {#each $recipePage as id (id)}
            <div animate:flip="{{duration:300}}"
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
        {/each}
        {#each [1,2,3] as i}
            <div class="card filler">
                <RecCard size="sm" rec="{{}}"
                >
                </RecCard>
            </div>
        {/each}
    </div>
    {$recipePage.length} IDs: <JsonDebug data={$recipePage}/>
</FullHeight>
<style>
 .card.filler {
     visibility: hidden;
 }
 .cards {
     display: flex;
     flex-wrap: wrap;
     place-content: space-around;
 }
 
 /* https://stackoverflow.com/questions/18744164/flex-box-align-last-row-to-grid */
 .cards::after {
     content: "";
     flex: auto;
 }

 .card {
     display: inline-block;
 }
 table {
     margin: auto; /* center  */
 }
 /* Grid mode */
 
 table :global(td.title) {grid-area:title;}
 table :global(td.thumb) {grid-area:thumb;}
 table :global(td.categories) {grid-area:categories;}
 table :global(td.sources) {grid-area:sources;}
 table :global(td.times) {grid-area:times;}
 table :global(td.title) {grid-area:title;}
 table :global(td.title) {
     min-width: 329px;
     max-width: 450px;
 }
 @media (max-width: 949px) {
     table :global(td) {
         border : none;
     }
     table tr {
         border-bottom: 1px solid var(--light-underline);
         padding-bottom: 1.5em;
         padding-top: 1.5em;
         justify-items: left;
         justify-content: center;
     }

     table :global(td.categories),
     table :global(td.sources) {
         align-self: start;
     }
 }
 @media (max-width: 620px) {
     table tr {
         display : grid;
         align-items: center;
         grid-template-columns: 28px 2fr 1fr;
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
 @media (min-width: 621px) and (max-width: 949px) {
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
         grid-template-columns: 28px 1fr 1fr 150px;
         grid-template-areas:
             "checkbox title      title   thumb"
             ".        categories sources thumb";
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
 @media (min-width: 950) {
     tr :global(td.thumb) {
         max-width: 150px;
         width: 150px;
     }
     tr :global(td.categories),
     tr :global(td.sources) {
         max-width: 200px;
         width: 200px;
     }
     tr :global(td.title) {
         max-width: 400px;
         width: 400px;
     }

 }

 @media (min-width: 950px) {
     table {
         max-width: 1250px;
         margin-left: auto;
         margin-right: auto;
         /* border-collapse: separate;
            border-spacing: 5px 2rem; */
     }
     table :global(td) {
         border-bottom: 1px solid var(--light-underline);
         padding-top: 1em;
         padding-bottom: 1em;
         vertical-align: middle;
     }
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
     width: 12rem;
     margin-left: 1em;
 }
 .searchBar.searching {
     cursor: busy;
 }
</style>
