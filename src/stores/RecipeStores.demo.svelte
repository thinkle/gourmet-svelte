<script>
 import JsonDebug from '../widgets/JsonDebug.svelte';
 import {
     connected,
     recipeState,
     recipeActionState,
     recipeActionGeneralState,
     storedRecipes,
     localRecipes,
     openLocalRecipes,
     recipePage,
     recipeActions} from './recipeStores.js';
 import Tester from '../widgets/Tester.svelte';
 import {testRecs} from '../common/mocks/recipes.js'
 export let initialShow
 let action;
 let theRec;
 function changeTheRec () {
     theRec.title += '~!~';
 }

 let storesToShow = {
     $recipeState,
     $recipeActionState,
     $recipeActionGeneralState,
     $storedRecipes,
     $localRecipes,
     $openLocalRecipes,
     $recipePage,
 }
 function setTheRec (d) {
     theRec=d
 }

</script>
<div>
    <Tester name="Recipe Store" {initialShow}>
        <br>$connected {$connected}
        {#if action}
            {#await action}
                Running action...
            {:then json}
                Ran Action, got Data: <JsonDebug data="{json}"/>
                {setTheRec(json)}
            {:catch err}
                Got Error? <JsonDebug data="{err}"/>
            {/await}
        {/if}
        <br>
        <button on:click={async ()=>{action=await recipeActions.createRecipe(testRecs.standard)}}>Create Standard</button>
        <button on:click={async ()=>{action=await recipeActions.createRecipe(testRecs.empty)}}>Create Empty</button>
        <button on:click={async ()=>{action=await recipeActions.getRecipe(1)}}>Get Recipe</button>
        <button on:click={async ()=>{action=await recipeActions.getRecipes()}}>Get Recipe<u>s</u></button>
        <button on:click={async ()=>{action=await recipeActions.deleteRecipe(1)}}>Delete Recipe</button>
        <button on:click={async ()=>{action=await localRecipes.open(1)}}>Open Recipe</button>
        <button on:click={async ()=>{action=await localRecipes.close(1)}}>Close Recipe</button>
        <button on:click={async ()=>{
                         changeTheRec();
                         action = await recipeActions.updateRecipe(theRec);
                         }}>Update Recipe</button>
        <br>
        {#if theRec}
            The Recipe <JsonDebug data="{theRec}"/>
        {/if}
        {#each Object.keys(storesToShow) as store}
            {store} : <JsonDebug data="{storesToShow[store]}"/>
        {/each}
    </Tester>
</div>

<style>
 div div {
     max-height: 40vh;
     overflow-y: scroll;
 }
</style>
