<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let editOnOpen=undefined;
 export let rec=undefined;
 export let onChange=undefined;;
 export let onOpenSubRec=undefined;
 export let showShopping = true;
 export let editMode = false;
 export let editable = true;
 export let onEditToggle = undefined
 export let minPropWidth = 150;
 export function setEditMode (val) {
     editMode = val;
 }

 import {getColor} from './colors.js';
 let color;
 $: color = getColor(rec);

 import {
     Bar,
     AmountInput,
     IconButton,
     NavActions,
     StatusIcon,
 }  from '../../widgets/';
 import SideBySide from '../../widgets/layout/SideBySide.svelte';

 import IngredientList from '../ing/IngredientList.svelte';
 import RecProp from '../props/RecProp.svelte';

 import RecDef from '../../common/RecDef.js';


 import {recipeState,recipeActions} from '../../stores/recipeStores.js';
 import {shoppingList} from '../../stores/shoppingStores.js';
 import {onMount,setContext,getContext} from 'svelte'
 import {writable} from 'svelte/store'
 import { watchResize } from "svelte-watch-resize";
 // import deepcopy from 'deepcopy'; 
 import {deepcopy} from './libraries.js'; 

 $: { if (rec && !rec.title && editable) {editMode=true}}

            let valid = false;
 $: {
     valid = isValid(rec);
 }



 $: handleEditToggle(editMode)


 function handleEditToggle (editMode) {
     if (onEditToggle) {
         onEditToggle(editMode);
     }
     if (!rec) {return}
     for (let prop of RecDef.recProps) {
         if (editMode) {
             // check for empty props and populate them...
             if (prop.array && prop.empty &&
                 (!rec[prop.name] || rec[prop.name].length==0)
             ) {
                 rec[prop.name] = deepcopy(prop.empty)
             }
         } else {
             // check for empty props and remove them...
             if (prop.empty &&
                 prop.array &&
                 JSON.stringify(rec[prop.name]) == JSON.stringify(prop.empty)
             ) {
                 delete rec[prop.name]; // remove the prop...
             } 
         }
     }
     rec = rec;
 }



 function triggerChange () {
     if (onChange) {
         onChange(rec);
     }
 }

 $: if (rec && rightBlock && imageBlock) {handleResize()}
 
 var ingeditmode = false;
 
 
 // Store business...
 let multiplier = writable(1);
 setContext('multiplier',multiplier);
 let ingredientList = writable([]);
 setContext('ingredientList',ingredientList);
 let highlightedIngredient = writable({active:[]});
 setContext('highlightedIngredient',highlightedIngredient);


 $: if (rec && rec.ingredients) {
     // Let's check for a change before assigning...
     updateIngredientList()
 }

 function updateIngredientList () {
     let items = crawl($ingredientList);
     for (let ing of rec.ingredients) {
         if (items.indexOf(ing.text)==-1) {
             $ingredientList = deepcopy(rec.ingredients);
             return
         }
         if (ing.ingredients) {
             for (let ii of ing.ingredients) {
                 if (items.indexOf(ii.text)==-1) {
                     $ingredientList = deepcopy(rec.ingredients);
                     return
                 }
             }
         }
     }
     
     function crawl (ii,items=[]) {
         for (let i of ii) {
             items.push(i.text);
             if (i.ingredients) {
                 crawl(i.ingredients,items)
             }
         }
         return items;
     }
 }

 // Delete me
 let recipeChanges = writable(0);
 setContext('recipeChanges',recipeChanges);
 // end delete me
 let imageBlock;
 let imageBlockWidth;
 let rightBlock;
 let widthLeftOfImage = ''
 let imageCentered = false;
 let maxImageWidth = 100;
 /* onMount(()=>{
  *     handleResize()
  * }
  * ); */
 
 let  rightBlockWidth
 function handleResize () {
     if (!imageBlock || !rightBlock) {
         return;
     }
     if (!imageCentered) {
         imageBlockWidth = imageBlock.clientWidth;
     }
     rightBlockWidth = rightBlock.clientWidth;
     widthLeftOfImage = rightBlock.clientWidth - imageBlockWidth - 30;
     if (widthLeftOfImage < minPropWidth) {
         widthLeftOfImage = rightBlock.clientWidth;
         imageCentered = true;
     }
     else {
         imageCentered = false
     }
     maxImageWidth = rightBlockWidth - 20;
     
 }

 function resizeOnUpdate (node) {
     handleResize(); // initial handle resie...
     return {
         update () {
             handleResize();
         },
     }
 }

 /* Check if our recipe is valid - helps us display a message rather
    than crashing outright... */
 function isValid (rec) {
     if (!rec) {return false}
     if (!rec.images || !Array.isArray(rec.images)) { return false }
     if (!rec.ingredients || !Array.isArray(rec.ingredients)) { return false }
     return true;
 }


 let loginContext = getContext('login')
 let doLogin
 if (loginContext) {
     let {doLogin} = loginContext;
 } else {
     doLogin = ()=>window.alert('No login context')
 }

 

</script>

{#if valid}
    <div class='recipe-wrap'
         style="{(color&&`--accent-bg: ${color.bg}; --accent-fg: ${color.fg};`||'')}">
        <!-- Above the side-by-side view... -->

    <!-- <div class="top" use:watchResize="{handleResize}"> -->

    <Bar large="true" growLeft="{true}" maxWidth="1250px"
         style="border-bottom: 2px solid var(--accent-bg);">
        <div slot="left" style="align-items: flex-end">
            <h2>
	        {#each RecDef.titleProps as prop}
                    <RecProp
                        onChange="{triggerChange}"
                        showLabel="{false}"
                        editable="{editable}"
                        forceEdit="{editMode}"
                        prop="{prop}"
                        bind:value="{rec[prop.name]}"
                    />
                {/each}        
            </h2>
        </div>
        <div slot="right">
            <div class="status">
                <i class='material-icons'>
                    offline_pin
                </i>
                {#if rec}
                    {#if rec.savedRemote}
                        <StatusIcon icon="cloud_done" tooltip="true">
                            Saved to browser and in the cloud.
                            Last saved at {new Date($recipeState[rec.id].last_modified).toLocaleString()}
                            <IconButton icon="refresh" bare="true" small="true"
                                        on:click="{()=>recipeActions.getRecipe(rec.id)}"
                            />
                        </StatusIcon>
                    {:else if $recipeState[rec.id]}
                        <StatusIcon icon="cloud_off" tooltip="true">
                            Saving to the cloud failed - perhaps you're offline or you need to
                            <a on:click="{()=>doLogin()}">log in again</a>.
                            Your recipe is still being stored up locally in your web browser, but it won't be available in other devices.
                            Saved locally at {new Date($recipeState[rec.id].last_modified).toLocaleString()}
                            <IconButton icon="refresh" bare="true" small="true"
                                        on:click="{()=>recipeActions.getRecipe(rec.id)}"
                            />
                        </StatusIcon>
                    {:else}
                        <StatusIcon icon="info" tooltip="true" >
                            Huh, no state information found for this recipe at all. Are you testing or is this a bug?
                            <IconButton icon="refresh" bare="true" small="true"
                                        on:click="{()=>recipeActions.getRecipe(rec.id)}"
                            />
                        </StatusIcon>
                    {/if}
                {/if}
            </div>
            <NavActions>
                {#if showShopping}
                    <li><IconButton
                            icon="shopping_cart"
                            on:click="{async ()=>{
                                      await shoppingList.addRecipe(rec.id,$multiplier);
                                      shoppingList.save();
                                      }}">
                        Add to List
                    </IconButton></li>
                {/if}
                {#if editable}
                    <li><IconButton
                            icon="edit"
                            toggle="{true}"
                            toggled="{editMode}"
                            on:click="{()=>editMode=!editMode}">
                        Edit{#if editMode}ing{/if}
                        Recipe
                    </IconButton></li>
                    {#if $recipeState[rec.id] && ($recipeState[rec.id].edited)}
                        <li><IconButton icon="undo" on:click="{()=>recipeActions.revertRecipe(rec.id)}"
                                        busy="{$recipeState[rec.id].updating}"
                            >
                            Revert Changes
                        </IconButton></li>
                        <li><IconButton
                                icon="save"
                                tooltip="Attempt to save?"
                                busy="{$recipeState[rec.id].updating}"
                                on:click="{()=>recipeActions.updateRecipe(rec).then(editMode=false)}">
                            Save
                        </IconButton></li>
                    {:else if $recipeState[rec.id] && !$recipeState[rec.id].savedRemote}
                        <li><IconButton
                                busy="{$recipeState[rec.id].updating}"
                                icon="cloud_upload"
                                on:click="{()=>recipeActions.updateRecipe(rec)}">
                            Save to Cloud
                        </IconButton></li>
                    {/if}
                {/if}
            </NavActions>
        </div>
    </Bar>
    <!-- </div> --> <!-- End top section -->
    <!-- Main recipe  -->
    <SideBySide
        leftWidth="325" 
        maxWidth="1250px"
        stackSidesAt="{550}"
        maxWidthRight='45rem' maxWidthLeft='45rem'
    >
	<div class="inghead" slot="leftHead"> 
	    <h3>Ingredients</h3>
            {#if !editMode && editable}
                {#if ingeditmode}
                    <IconButton
                        small="{true}"
                        bare="true"
                        on:click="{()=>ingeditmode=false }"
                        ariaLabel="Finish editing ingredients"
                        icon="done"/>
                {:else}
                    <IconButton
                        small="{true}"
                        bare="true"
                        ariaLabel="Edit ingredients"
                        on:click="{()=>ingeditmode=true }"
                        icon="edit" />
                {/if}
            {/if}
            <div class='multiplier'>
                &times;
                <AmountInput
                    ariaLabel="multiply by"
                    value="{$multiplier}"
                    on:change="{(e)=>$multiplier=e.detail}"
                    showPlusMinusButtons="{true}"
                />
            </div>
	</div>
	<div slot="left" on:dblclick="{()=>ingeditmode=true}">
	    <IngredientList
                {editable}
                {onOpenSubRec}
                onChange="{triggerChange}"
                editMode="{editMode||ingeditmode}"
                bind:ingredients="{rec.ingredients}"
            >
	    </IngredientList>
	</div>		
	
	<div class='rectext' slot="right" bind:this="{rightBlock}" use:resizeOnUpdate style="{`--widthRightBlock:${rightBlockWidth}px`}">
            <div class="topblock" style="{`--widthLeftOfImage:${widthLeftOfImage}px`}">
                <div class="props" >
                    {#if false}
                        <div class="images" class:centered="{imageCentered}" use:resizeOnUpdate bind:this="{imageBlock}"
                             style="{`--max-image-width:${maxImageWidth}px`}"
                        >
                            {#each rec.images as image}
                                <!-- Small: <img alt="{image.alt||rec.title}" src="{image.thumbnailUrl}"/> -->
                                <img alt="{image.alt||rec.title}" src="{image.url}"/>
                            {/each}
                        </div> <!-- close images -->
                    {/if}
                    {#each RecDef.recProps.filter((p)=>!p.bottom) as prop}
                        <div class="prop">                                
                            <RecProp
                                floatWidth="{widthLeftOfImage}"
                                onChange="{triggerChange}"
                                editable="{editable}"
                                forceEdit="{editMode}"
                                prop="{prop}"
                                bind:value="{rec[prop.name]}"/>   
                        </div>
                        <!-- Close flowing props  -->
                    {/each}
                    <!-- block props  -->
                    {#each RecDef.recProps.filter((p)=>p.bottom) as prop}
                        <div class="prop bottomProp">
                            <RecProp
                                floatWidth="{widthLeftOfImage}"
                                onChange="{triggerChange}"
                                editable="{editable}"
                                forceEdit="{editMode}"
                                prop="{prop}" bind:value="{rec[prop.name]}"/>
                        </div>
                    {/each}
                    <!-- end block props -->

                </div> <!-- close props -->
            </div> <!-- close topblock -->
	</div> <!-- close right slot -->
    </SideBySide>
    </div>
{:else}
    {#if !rec}
        Loading recipe...
    {:else}
        Invalid Recipe: {JSON.stringify(rec)}.
    {/if}
{/if}

<style>
 .small {
     font-size: var(--small);
 }
 /* .top {
    display: flex;
    align-items: center;
    }
    .top button:nth-of-type(1) {
    margin-left: auto;
    }
    .top button {
    margin-right: 1em;
    } */
 .images {
     float : right;
 }
 /* .props {
    display: inline-block;
    } */
 div :global(h2,h3,h4,h5,h5,h6) {
     font-family: var(--recipeHeadFont);
 }
 .editContainer {
     display: contents;
 }
 h2 {
     flex-grow: 2;
     font-weight: bold;
     font-size: 1.5rem;
 }
 .prop:first-child {
     margin-top: 0;
 }
 .prop {
     margin-top: 5px;
 }
 .centered {
     width: 100%;
     margin: auto;
     display: flex;
     justify-content: center;
     align-items: center;
 }
 .multiplier {
     margin-left: 1em;
     margin-right: auto;
     display: flex;
 }
 .images img {
     max-width: var(--max-image-width);
 }
 .recipe {
     max-width: 90rem;
     margin: auto;
     display: flex;
     flex-direction: column;
 }
 @media (max-width: 599px) {
     h2 {
         max-width: calc(100vw - 60px);
         text-overflow: ellipsis;
         overflow: hidden;
         white-space: nowrap;
     }
     h2:hover :global('.title') {
         max-width: calc(100vw - 210px);
         text-overflow: ellipsis;
         overflow: initial;
         white-space: normal;
     }

 }

 .inghead {
     display: flex;
     flex-direction: row;
 }
 .recipe-wrap {
     display: contents;
 }
</style>
