<script>
 import {recipeData,recipeActions,connected} from '../../stores/recipeData.js';
 import {testRecs} from '../../common/mocks/recipes.js'
 import Recipe from './Recipe.svelte'
 $: {
     if ($connected) {
         console.log('Fetch those recipes...');
         recipeActions.getRecipes();
     }
     else {
         console.log('No connection yet... holding off');
     }
 }
 export let open = [];
 let recipes = []
 $: {
     if ($recipeData) {
         console.log('Got new data!',$recipeData);
         recipes = Object.values($recipeData);
     }
 }
</script>
<div>
    <h2>Recipes</h2>
    <ul>
        {#each recipes as recipe}
            <li class:changed={recipe.changed}>                
                {#if open.map((r)=>r.current.id).indexOf(recipe.current.id)==-1}
                <a on:click={()=>{open.push(recipe);open=open}}>
                    {recipe.current.id}</a>
                {/if}
                {recipe.current && recipe.current.title || recipe.local && recipe.local.title || 'wtf?'}  
            </li>
            {:else}
            <div>
                No recipes yet? Maybe import some or create them!
                {#if $connected}<button on:click={()=>recipeActions.createRecipe(testRecs.empty)}>Create Your First Recipe</button>
                    {:else}(Connecting...)
                {/if}

                <a href="broken">Install the Chrome Plugin to make it easy to import from webpages</a>
            </div>
        {/each}
        {#each open as recipe}
            <Recipe rec={recipe.current}/>
        {/each}
        <pre>
            {JSON.stringify($recipeData)}
        </pre>
</div>
<style>
 .changed {font-style: italic; color: purple;}
</style>
