<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(Number("BUILD_MS"));

 export let rec=undefined;
 export let onChange=undefined;;
 export let onOpenSubRec=undefined;
 export let showShopping = true;
 export let editMode = false;
 export let editable = true;
 export let minPropWidth = 150;

 import AmountInput from '../../widgets/AmountInput.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 import StatusIcon from '../../widgets/StatusIcon.svelte';
 import SideBySide from '../../widgets/SideBySide.svelte';


 import IL from '../ing/IngredientList.svelte';
 import RecProp from '../props/RecProp.svelte';

 import RecDef from '../../common/RecDef.js';


 import {recipeState,recipeActions} from '../../stores/recipeStores.js';
 import {shoppingList} from '../../stores/shoppingStores.js';
 import {onMount,setContext} from 'svelte'
 import {writable} from 'svelte/store'
 import { watchResize } from "svelte-watch-resize";
 // import deepcopy from 'deepcopy'; 
 import {deepcopy} from './libraries.js'; 

 $: { if (rec && !rec.title && editable) {editMode=true}}

                           let valid = false;
 $: {
     valid = isValid(rec);
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


</script>

{#if valid}
    <div class="recipe"> <!-- top-level container...  -->
        <!-- Above the side-by-side view... -->
        <div class="top" use:watchResize="{handleResize}">
            <h2>
	        {#each RecDef.titleProps as prop}
                    <span>
                        <RecProp
                            onChange="{triggerChange}"
                            showLabel="{false}"
                            editable="{editable}"
                            forceEdit="{editMode}"
                            prop="{prop}"
                            bind:value="{rec[prop.name]}"
                        />
                    </span>
                {/each}        
            </h2>
            <div class='multiplier' style="width:6em">
                &times;
                <AmountInput
                    value="{$multiplier}"
                    on:change="{(e)=>$multiplier=e.detail}"
                    showPlusMinusButtons="{true}"
                />
            </div>
            {#if showShopping}
                <IconButton
                    icon="shopping_cart"
                    on:click="{async ()=>{
                              await shoppingList.addRecipe(rec.id,$multiplier);
                              shoppingList.save();
                              }}">
                    Add to List
                </IconButton>
            {/if}
            {#if editable}
                <IconButton
                    icon="edit"
                    toggle="{true}"
                    toggled="{editMode}"
                    on:click="{()=>editMode=!editMode}">
                    Edit{#if editMode}ing{/if}
                    Recipe
                </IconButton>

                {#if $recipeState[rec.id] && ($recipeState[rec.id].edited)}
                    <IconButton icon="undo" on:click="{()=>recipeActions.revertRecipe(rec.id)}"
                                busy="{$recipeState[rec.id].updating}"
                    >
                        Revert Changes
                    </IconButton>
                    <IconButton
                        icon="save"
                        tooltip="Attempt to save?"
                        busy="{$recipeState[rec.id].updating}"
                        on:click="{()=>recipeActions.updateRecipe(rec)}">
                        Save
                    </IconButton>
                {:else if $recipeState[rec.id] && !$recipeState[rec.id].savedRemote}
                    <IconButton
                        busy="{$recipeState[rec.id].updating}"
                        icon="cloud_upload"
                        on:click="{()=>recipeActions.updateRecipe(rec)}">
                        Save to Cloud
                    </IconButton>
                {/if}
            {/if}
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
                            Saving to the cloud failed - perhaps you're offline?
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
        </div> <!-- End top section -->
        <!-- Main recipe  -->
        <SideBySide
            height="80vh"
            leftWidth="{325}"
            maxWidth="{1250}"
            stackSidesAt="{550}"
            maxWidthRight='45rem' maxWidthLeft='45rem'
        >
	    <h3 slot="leftHead"> 
	        Ingredients
                {#if !editMode && editable}
                    {#if ingeditmode}
                        <IconButton
                            small="{true}"
                            bare="true"
                            on:click="{()=>ingeditmode=false }"
                            icon="done"/>
                    {:else}
                        <IconButton
                            small="{true}"
                            bare="true"
                            on:click="{()=>ingeditmode=true }"
                            icon="edit" />
                    {/if}
                {/if}
	    </h3>
	    <div slot="left">
	        <IL
                    {editable}
                    {onOpenSubRec}
                    onChange="{triggerChange}"
                    editMode="{editMode||ingeditmode}"
                    bind:ingredients="{rec.ingredients}"
                >
	        </IL>
	    </div>		
	    
	    <div class='rectext' slot="right" bind:this="{rightBlock}" use:resizeOnUpdate style="{`--widthRightBlock:${rightBlockWidth}px`}">
                <div class="topblock" style="{`--widthLeftOfImage:${widthLeftOfImage}px`}">
                    <div class="props" >
                        
                        <div class="images" class:centered="{imageCentered}" use:resizeOnUpdate bind:this="{imageBlock}"
                             style="{`--max-image-width:${maxImageWidth}px`}"
                        >
                            {#each rec.images as image}
                                <!-- Small: <img alt="{image.alt||rec.title}" src="{image.thumbnailUrl}"/> -->
                                <img alt="{image.alt||rec.title}" src="{image.url}"/>
                            {/each}
                        </div> <!-- close images -->

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
    </div>  <!-- close container  -->
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
 .top {
     display: flex;
     align-items: center;
 }
 .top button:nth-of-type(1) {
     margin-left: auto;
 }
 .top button {
     margin-right: 1em;
 }
 .images {
     float : right;
 }
 /* .props {
    display: inline-block;
    } */
 div :global(h2,h3,h4,h5,h5,h6) {
     font-family: var(--recipeHeadFont);
 }
 h2 {
     flex-grow: 2;
     font-weight: bold;
     text-align: center;
     font-size: 2rem;
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
</style>
