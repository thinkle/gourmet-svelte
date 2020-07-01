<script>
 export let id
 import {connected,
        recipeActions,
        storedRecipes,
        openLocalRecipes,
        localRecipes,
        recipeState} from '../stores/recipeStores.js';
 import Recipe from './rec/Recipe.svelte';
 import {FullHeight,Bar,WhiskLogo} from '../widgets/';

 async function open () {
     if (!isNaN(Number(id))) {
         await recipeActions.openRecipe(Number(id))
     }
     else {
         await recipeActions.openRecipe(id)
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
        <span slot="center">{$localRecipes[id] && $localRecipes[id].title}</span>
        <b slot="right">Gourmet</b>
    </Bar>
    <FullHeight scroll="{false}">
    {#if $localRecipes[id]}
        <Recipe rec={$localRecipes[id]}
                    onChange={(rec)=>{
                             console.log('SingleRecipe onChange',rec)
                             $localRecipes[rec.id]=rec
                             }}
        />
    {:else}
        <blockquote>
            Loading recipe... just one second
            <WhiskLogo/>
            <!-- <button on:click={()=>open(id)}>Kick it</button> -->
        </blockquote>
    {/if}
    </FullHeight>


   
    <style>
     blockquote {
         position: fixed;
         width: 100vw;
         height: 100vh;
         top: 0;
         left: 0;
         align-items: center;
         justify-items: center;
     }
</style>
