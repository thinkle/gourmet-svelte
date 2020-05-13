<script>
 import IL from './IngredientList.svelte';
 import RecDef from '../../common/RecDef.js';
 import RecProp from './RecProp.svelte';
 import SideBySide from '../../widgets/SideBySide.svelte';
 import RecBlock from './RecBlock.svelte';
 import AmountInput from '../../widgets/AmountInput.svelte';
 import {recipeData,recipeActions,connected,updateCount} from '../../stores/recipeData.js';
 import {onMount,setContext} from 'svelte'
 import {writable} from 'svelte/store'
 let changed;

 export let rec={ingredients : [],
                text : [],
                images : [],
                };

 export var editMode = false;
 export let editable = true;
 var ingeditmode = false;
 
 
 // Store business...
 let multiplier = writable(1);
 setContext('multiplier',multiplier);
 let recipeChanges = writable(0);
 setContext('recipeChanges',recipeChanges);
 let lastUpdateCheck = 0;
 $: if ($recipeChanges > lastUpdateCheck) {
     console.log('Recipe calls updateCurrent');
     recipeActions.updateCurrent(rec.id,rec)
     lastUpdateCheck = $recipeChanges;
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
        <div style="width:6em">
            &times;
            <AmountInput value={$multiplier} on:change={(e)=>$multiplier=e.detail}
                         showPlusMinusButtons={true}
            />
        </div>
        <span>Change Events: {$recipeChanges}. Update: {$updateCount[rec.id]}</span>
        <button class="toggle" class:active-toggle={editMode} on:click={()=>editMode=!editMode}>
            Edit{#if editMode}ing{/if}
            Recipe <i class="material-icons">edit</i></button>
        {#if $recipeData && rec && rec.id && $recipeData[rec.id] && $recipeData[rec.id].changed}
            <button
                class:busy={$recipeData[rec.id].localState=='updating'}
                           on:click="{()=>recipeActions.updateRecipe(rec)}">
                Save Recipe
            </button>
        {/if}
    </div>
    <SideBySide height="80vh" growRight="true" leftBasis="300px" rightBasis="600px">
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
                            <RecProp editable={editable} forceEdit={editMode} prop={prop} bind:value={rec[prop.name]}/>
                        {/if}
                        {#if editMode}
                            {#if !rec.hasOwnProperty(prop.name)}
                                <div class="small"><button on:click={()=>rec[prop.name]=prop.empty}>Add {prop.label}?</button></div>
                            {/if}
                        {/if}
                    {/each}
                </div>
            </div>
            {#each rec.text as textBlock}
                <RecBlock bind:value="{textBlock}" forceEdit="{editMode}"/>
            {/each}
            {#if editMode}<div class="small"><button on:click={()=>rec.text.push({header:'More Text',text:''})}>Add more text</button></div>{/if}
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
