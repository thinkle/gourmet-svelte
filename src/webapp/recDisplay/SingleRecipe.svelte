<script>
 export let id
 import {connected,recipeActions,storedRecipes,openLocalRecipes,localRecipes,recipeState} from '../../stores/recipeStores.js';
 import Recipe from './Recipe.svelte';
 let rec

 async function open () {
     if (!isNaN(Number(id))) {
         rec = await recipeActions.openRecipe(Number(id))
     }
     else {
         rec = await recipeActions.openRecipe(id)
     }
 }

 $: if ($connected && id) {
     open(id)
 }
 

</script>
<div>
    <a target="_BLANK" href="/">
        To all recipes...
    </a>
    {#if rec}
        <Recipe rec={rec}
                onChange={(rec)=>{$localRecipes[rec.id]=rec}}
        />
    {:else}
        Loading recipe... just one second
        <button on:click={()=>open(id)}>Kick it</button>
    {/if}
</div>

   
<style>
 div {
     max-width: 1400px;
     margin: auto;
 }
 :global(body) {     
     margin: 0;
     width: 100%;
     height: 100%;
 }
</style>
