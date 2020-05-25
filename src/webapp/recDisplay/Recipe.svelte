<script>
 import IL from './IngredientList.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 import RecDef from '../../common/RecDef.js';
 import RecProp from './RecProp.svelte';
 import SideBySide from '../../widgets/SideBySide.svelte';
 import RecBlock from './RecBlock.svelte';
 import AmountInput from '../../widgets/AmountInput.svelte';

 import {recipeState,recipeActions} from '../../stores/recipeStores.js';
 import {onMount,setContext} from 'svelte'
 import {writable} from 'svelte/store'
 import { watchResize } from "svelte-watch-resize";


 export let rec=undefined;

 export let editMode = false;
 export let editable = true;

 export let onChange;

 function triggerChange () {
     if (onChange) {onChange(rec);}
 }

 $: if (rec && rightBlock && imageBlock) {handleResize()}
 
 var ingeditmode = false;
 
 
 // Store business...
 let multiplier = writable(1);
 setContext('multiplier',multiplier);
 
 // Delete me
 let recipeChanges = writable(0);
 setContext('recipeChanges',recipeChanges);
 // end delete me
 let imageBlock;
 let imageBlockWidth;
 let rightBlock;
 let widthLeftOfImage = ''
 let imageCentered = false;
 export let minPropWidth = 150;
 onMount(()=>{
     handleResize()
 }
 );
 
 
let  rightBlockWidth
 function handleResize () {
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
 }
 

</script>
{#if rec}
    <div class="recipe"> <!-- top-level container...  -->
        <!-- Above the side-by-side view... -->
        <div class="top" use:watchResize={handleResize}>
            <h2>
	        {#each RecDef.titleProps as prop}
                    <span>
                        <RecProp onChange={triggerChange} showLabel={false} editable={editable} forceEdit={editMode} prop={prop} bind:value={rec[prop.name]}></RecProp>
                    </span>
                {/each}        
            </h2>
            <div style="width:6em">
                &times;
                <AmountInput value={$multiplier} on:change={(e)=>$multiplier=e.detail}
                             showPlusMinusButtons={true}
                />
            </div>
            {#if editable}
                <IconButton icon="edit" toggle={true} toggled={editMode} on:click={()=>editMode=!editMode}>
                    Edit{#if editMode}ing{/if}
                    Recipe
                </IconButton>

                {#if $recipeState[rec.id] && $recipeState[rec.id].edited}
                    <button on:click="{()=>recipeActions.revertRecipe(rec.id)}">
                        Revert
                    </button>
                    <button
                        class:busy={$recipeState[rec.id].updating}
                                   on:click="{()=>recipeActions.updateRecipe(rec)}">
                        Save Recipe!
                    </button>
                {/if}
            {/if}
        </div> <!-- End top section -->
        <!-- Main recipe  -->
        <SideBySide height="80vh" growRight="true" leftBasis="300px" rightBasis="600px">
	    <h3 slot="leftHead"> 
	        Ingredients
                {#if !editMode && editable}
                    {#if ingeditmode}
                        <IconButton small={true} bare="true" on:click={()=>ingeditmode=false } icon="done"/>
                    {:else}
                        <IconButton small={true} bare="true" on:click={()=>ingeditmode=true } icon="edit" />
                    {/if}
                {/if}
	    </h3>
	    <div slot="left">
	        <IL
                    onChange={triggerChange}
                             editable={editable}
                    editMode="{editMode||ingeditmode}"
                    bind:ingredients={rec.ingredients} maxWidth="350"
                >
	        </IL>
	    </div>		
	    
	    <div slot="right" bind:this={rightBlock} style={`--widthRightBlock:${rightBlockWidth}px`}>
                <div class="topblock" style={`--widthLeftOfImage:${widthLeftOfImage}px`}>
                    <div class="props" >
                        
                        <div class="images" class:centered={imageCentered} bind:this={imageBlock}>
                            {#each rec.images as image}
                                <!-- Small: <img alt={image.alt||rec.title} src={image.thumbnailUrl}/> -->
                                <img alt={image.alt||rec.title} src={image.url}/>
                            {/each}
                        </div> <!-- close images -->

                        {#each RecDef.recProps.filter((p)=>!p.bottom) as prop}
                            <div class="flowingProps">
                                {#if rec.hasOwnProperty(prop.name)}
                                    <RecProp
                                        floatWidth={widthLeftOfImage}
                                                   onChange={triggerChange} editable={editable} forceEdit={editMode} prop={prop} bind:value={rec[prop.name]}/><br>
                                {/if}
                                {#if editMode}
                                    {#if !rec.hasOwnProperty(prop.name)}
                                        <div style="inline-block" class="small"><button on:click={()=>rec[prop.name]=prop.empty}>Add {prop.label}?</button></div><br>
                                    {/if}
                                {/if}
                            </div>
                            <!-- Close flowing props  -->
                        {/each}
                        <!-- block props  -->
                        {#each RecDef.recProps.filter((p)=>p.bottom) as prop}
                            {#if rec.hasOwnProperty(prop.name)}
                                <RecProp
                                    floatWidth={widthLeftOfImage}
                                    onChange={triggerChange}
                                    editable={editable}
                                    forceEdit={editMode}
                                    prop={prop} bind:value={rec[prop.name]}/>
                            {/if}
                            {#if editMode}
                                {#if !rec.hasOwnProperty(prop.name)}
                                    <div style="inline-block" class="small">
                                        <button on:click={()=>rec[prop.name]=prop.empty}>Add {prop.label}?</button> <!-- add text button -->
                                    </div>
                                {/if}
                            {/if}
                        {/each}
                        <!-- end block props -->

                    </div> <!-- close props -->
                </div> <!-- close topblock -->
	    </div> <!-- close right slot -->
        </SideBySide>
    </div>  <!-- close container  -->
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
             h2,h3,h4,h5,h5 {
                 font-family: var(--recipeHeadFont);
             }
             .flowingProps {
                 width : 200px;
                 width: var(--widthLeftOfImage);
             }
             .centered {
                 width: 100%;
                 margin: auto;
                 display: flex;
                 justify-content: center;
                 align-items: center;
             }
            </style>
