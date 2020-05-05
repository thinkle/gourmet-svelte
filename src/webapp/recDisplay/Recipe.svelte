<script>
 import IL from './IngredientList.svelte';
 import RecDef from '../../common/RecDef.js';
 import RecProp from './RecProp.svelte';
 import SideBySide from '../../widgets/SideBySide.svelte';
 import RecBlock from './RecBlock.svelte';
 import {recipeData,recipeActions,connected,updateCount} from '../../stores/recipeData.js';
 import {onMount} from 'svelte'
 let changed;

 export let rec={ingredients : [],
                properties : {},
                text : {},
                images : {},
                };
 export var editMode = false;
 export let editable = true;
 var ingeditmode = false;
 
 $: if (rec.id) {
     console.log('Recipe calls updateCurrent');
     recipeActions.updateCurrent(rec.id,rec)
     /*
      * $recipeData[rec.id].title = rec.title
      * $recipeData[rec.id].ingredients = rec.ingredients
      * $recipeData[rec.id].properties = rec.properties
      * $recipeData[rec.id].text = rec.text
      * $recipeData[rec.id].images = rec.images
      * changed = recipeActions.checkChanges(rec.id) */
 }
 
     
     
</script>

<div>
    <div class="top" >
        <h2>
	    {#each RecDef.titleProps as prop}
                <span>
                    <RecProp showLabel={false} editable={editable} forceEdit={editMode} prop={prop} bind:value={rec[prop.name]}></RecProp>
                </span>
            {/each}        
        </h2>
        <span>Update: {$updateCount[rec.id]}</span>
        <button class="toggle" class:active-toggle={editMode} on:click={()=>editMode=!editMode}>
            Edit{#if editMode}ing{/if}
            Recipe <i class="material-icons">edit</i></button>
        {#if $recipeData && rec && rec.id && $recipeData[rec.id].changed}
            <button
                class:busy={$recipeData[rec.id].localState=='updating'}
                           on:click="{()=>recipeActions.updateRecipe(rec)}">
                Save Recipe
            </button>
        {/if}
    </div>
    <SideBySide height="60vh">
	<h3 slot="leftHead">
	    Ingredients
            {#if !editMode}
                {#if ingeditmode}
                    <button class="icon" on:click={()=>ingeditmode=false }><i class="material-icons">done</i></button>
                {:else}
                    <button class="icon" on:click={()=>ingeditmode=true }><i class="material-icons">edit</i></button>
                {/if}
            {/if}
	</h3>
	<div slot="left">
	    <IL  editMode="{editMode||ingeditmode}" bind:ingredients={rec.ingredients} maxWidth="350">
	    </IL>
	</div>		
	
	<div slot="right">
            {#if rec.images && rec.images.image}
                <img alt={rec.title} src={rec.images.image}/>
            {/if}
            {#each RecDef.recProps as prop}
                {#if rec.properties.hasOwnProperty(prop.name)}
                    <RecProp editable={editable} forceEdit={editMode} prop={prop} bind:value={rec.properties[prop.name]}></RecProp>
                {:else}
                    {#if editMode}<div class="small"><button on:click={()=>rec.properties[prop.name]=prop.empty}>Add {prop.label}?</button></div>{/if}
                {/if}
            {/each}
            {#each RecDef.recBlocks as block}
                {#if rec.text.hasOwnProperty(block.name)}
                    <RecBlock prop={block} bind:value="{rec.text[block.name]}" forceEdit="{editMode}"/>
                {:else}
                    {#if editMode}<div class="small"><button on:click={()=>rec.text[block.name]=""}>Add {block.label}?</button></div>{/if}
                {/if}
            {/each}
	</div>
    </SideBySide>
</div>

<style>
 .small {
     font-size: 0.6rem
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
</style>
