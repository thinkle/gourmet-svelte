<script>
 export let id
 import {connected,
        recipeActions,
        storedRecipes,
        openLocalRecipes,
        localRecipes,
        recipeState} from '../stores/recipeStores.js';
 import Recipe from './rec/Recipe.svelte';
 import {FullHeight,Bar} from '../widgets/';
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

    <Bar>
        <a slot="left" target="_BLANK" href="/">
        Recipe List
        </a>
        <span slot="center">{rec && rec.title}</span>
        <b slot="right">Gourmet</b>
    </Bar>
    <FullHeight scroll="{false}">
    {#if rec}
        <Recipe rec={rec}
                onChange={(rec)=>{$localRecipes[rec.id]=rec}}
        />
    {:else}
        Loading recipe... just one second
        <button on:click={()=>open(id)}>Kick it</button>
    {/if}
    </FullHeight>


   
<style>
</style>
