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


 export let rec={ingredients : [],
                text : [],
                images : [],
                };

 export let editMode = false;
 export let editable = true;

 export let onChange;

 function triggerChange () {
     onChange(rec);
 }
 
 var ingeditmode = false;
 
 
 // Store business...
 let multiplier = writable(1);
 setContext('multiplier',multiplier);
 
 // Delete me
 let recipeChanges = writable(0);
 setContext('recipeChanges',recipeChanges);
 // end delete me
 

</script>

<div>
    <div class="top" >
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
            <button class="toggle" class:active-toggle={editMode} on:click={()=>editMode=!editMode}>
                Edit{#if editMode}ing{/if}
                Recipe <i class="material-icons">edit</i></button>{/if}

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
    </div>
    <SideBySide height="80vh" growRight="true" leftBasis="300px" rightBasis="600px">
	<h3 slot="leftHead">
	    Ingredients
            {#if !editMode && editable}
                {#if ingeditmode}
                    <IconButton bare="true" on:click={()=>ingeditmode=false } icon="done"/>
                {:else}
                    <IconButton bare="true" on:click={()=>ingeditmode=true } icon="edit" />
                {/if}
            {/if}
	</h3>
	<div slot="left">
	    <IL  editable={editable} editMode="{editMode||ingeditmode}" bind:ingredients={rec.ingredients} maxWidth="350" onChange={triggerChange}>
	    </IL>
	</div>		
	
	<div slot="right">
            <div class="topblock" >
                <div class="images" >
                    {#each rec.images as image}
                        <!-- Small: <img alt={image.alt||rec.title} src={image.thumbnailUrl}/> -->
                        <img alt={image.alt||rec.title} src={image.url}/>
                    {/each}
                </div>
                <div class="props" >
                    {#each RecDef.recProps as prop}
                        {#if rec.hasOwnProperty(prop.name)}
                            <RecProp onChange={triggerChange} editable={editable} forceEdit={editMode} prop={prop} bind:value={rec[prop.name]}/>
                        {/if}
                        {#if editMode}
                            {#if !rec.hasOwnProperty(prop.name)}
                                <div class="small"><button on:click={()=>rec[prop.name]=prop.empty}>Add {prop.label}?</button></div>
                            {/if}
                        {/if}
                    {/each}
                </div>
            </div>
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
 .images {
     float : right;
 }
 .props {
     display: inline-block;
 }
 
</style>
