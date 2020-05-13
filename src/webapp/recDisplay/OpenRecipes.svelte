<script>
 import Recipe from './Recipe.svelte'
 export let recipes=[];

 function getTabTitle (recipe) {
     return recipe.title && recipe.title.substr(0,30) || 'wtf?'; // fixme
 }

 let activeRecipe
 let hide = false;

 $: if (!activeRecipe && recipes.length) {activeRecipe = recipes[0].current}

 function removeRec (r) {
     let i = recipes.indexOf(r)
     recipes.splice(i,1)
     recipes = recipes;
     if (activeRecipe==r.current) {
         activeRecipe = undefined;
         if (i > 0) {
             activeRecipe = recipes[i-1].current
         }
         else {
             if (recipes.length>0) {
                 activeRecipe = recipes[0].current
             }
         }
     }
 }

</script>
<div>
    {#if recipes.length > 0}
    <div class="tabbox" class:hidden={hide}>
        <div class="tabs">
            {#each recipes as recipe}
                <span class:active={activeRecipe==recipe.current} on:click={()=>activeRecipe=recipe.current}>{getTabTitle(recipe.current)}
                    <button class="icon" on:click={()=>removeRec(recipe)}><i class="material-icons" >close</i></button>
                </span>
            {/each}
            <button on:click="{()=>hide=!hide}">
                {#if hide}
                    Max
                {:else}
                    Min
                {/if}
            </button>

        </div>
        <div class="content">
            <Recipe rec={activeRecipe}/>
            {JSON.stringify(activeRecipe)}
        </div>
    </div>
    {/if}
</div>
<style>
 div {
     transition: all 500ms;
 }

 .tabbox.hidden .content {
     height: 0px;
     opacity: 0;
     overflow: hidden;
 }

 .tabbox.hidden .tabs span {
     display: none;
 }

 .tabbox .content {
     height: 90vh;
     opacity: 1;
 }

 .tabs span {
     display: inline-block;
     padding: 0.5em;
     box-shadow: 3px 3px #887;
 }

 .tabs span:hover {
     background-color : #777;
 }

 .active {
     text-decoration: underline;
     background-color: #999;
     color: #ddd;
 }
 
</style>
