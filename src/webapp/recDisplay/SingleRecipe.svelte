<script>
 export let id
 import {connected,recipeActions,storedRecipes,openLocalRecipes,localRecipes,recipeState} from '../../stores/recipeStores.js';
 import Recipe from './Recipe.svelte';
 let rec

 async function openRecipe (id) {
     await recipeActions.getRecipe(id);
     localRecipes.open(id);
     rec = $localRecipes[id]
 }

 $: if (id) {
     openRecipe(id)
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
        <button on:click={()=>openRecipe(id)}>Kick it</button>
    {/if}
</div>

   
<style>
 div {
     max-width: 1400px;
     margin: auto;
 }
 :global(body) {
     overflow: hidden; /* prevent scrolling outside our recipe container */
     margin: 0;
     width: 100%;
     height: 100%;
 }
</style>
