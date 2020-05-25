<script>
 import {
     recipeState,
     storedRecipes,
     localRecipes,
     openLocalRecipes,
     recipePage,
     recipeActions} from './recipeStores.js';
 import Tester from '../widgets/Tester.svelte';
 import {testRecs} from '../common/mocks/recipes.js'
 export let initialShow
 let lastRec;
 let theRec = {title:'?'};
 $: {
     if ($recipeData.localState && $recipeData.localState.recipe) {
         theRec = $recipeData.localState.recipe
     }
 }

 $: {
     if ($recipeData.localState && $recipeData.localState.state=='doneFetching') {
         theRec = $recipeData.localState.lastFetched[
             Math.floor(Math.random()*$recipeData.localState.lastFetched.length) // rando item
         ]
     }
 }

 function changeTheRec () {
     theRec.title += '~!~';
 }

 function s () {
     lastRec = theRec;
 }

</script>
<div>
    <Tester name="Recipe Store" {initialShow}>
        <br>$recipeData.connected {$recipeData.connected}
        <br>
        <button on:click={()=>{s();recipeActions.createRecipe(testRecs.standard)}}>Create Standard</button>
        <button on:click={()=>{s();recipeActions.createRecipe(testRecs.empty)}}>Create Empty</button>
        <button on:click={()=>{s();recipeActions.getRecipe(theRec.id)}}>Get Recipe</button>
        <button on:click={()=>{s();recipeActions.getRecipes()}}>Get Recipe<u>s</u></button>
        <button on:click={()=>{s();recipeActions.deleteRecipe(theRec.id)}}>Delete Recipe</button>
        <button on:click={()=>{
                         changeTheRec();
                         recipeActions.updateRecipe(theRec);
                         }}>Update Recipe</button>
        <br>
        <h2>LOCAL STATE:</h2>
        <div>{JSON.stringify($recipeData.localState,null,2)}</div>
        <br>
        {#if lastRec}
            <h2>Last Recipe</h2>
            <div>recipeData {JSON.stringify($recipeData[lastRec.id],null,2)}
            </div>
        {/if}
        {#if theRec}
            <h2>The Recipe</h2>
            <div>RD: {JSON.stringify(theRec,null,2)}</div>
            <div>{JSON.stringify($recipeData[theRec.id],null,2)}</div>
        {/if}
        <h2>All the Data</h2>
        <div>{JSON.stringify($recipeData,null,2)}</div>

    </Tester>
</div>

<style>
 div div {
     max-height: 40vh;
     overflow-y: scroll;
 }
</style>
