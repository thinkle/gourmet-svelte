<script>
 import Recipe from './Recipe.svelte'
 import {openLocalRecipes,localRecipes,recipeState} from '../../stores/recipeStores.js';

 function getTabTitle (id) {
     return $localRecipes[id].title && $localRecipes[id].title.substr(0,30) || '???'; // fixme
 }

 let activeRecipeId
 let hide = false;

 $: if (!activeRecipeId && $openLocalRecipes.length) {activeRecipeId = $openLocalRecipes[0]}

 let showCloseModalFor
 function closeRec (id,confirmed=false) {
     showCloseModalFor = undefined;
     if (!$recipeState[id].edited||confirmed) {
         localRecipes.close(id);
     } else {
         console.log('Set closed modal!');
         showCloseModalFor = id;
     }
 }

</script>
<div>
    {#if $openLocalRecipes.length > 0}
    <div class="tabbox" class:hidden={hide}>
        <div class="tabs">
            {#each $openLocalRecipes as id}
                <span class:active={activeRecipeId==id} on:click={()=>activeRecipeId=id}>{getTabTitle(id)}
                    <button class="icon" on:click={()=>closeRec(id)}><i class="material-icons" >close</i></button>
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
            <Recipe onChange={(rec)=>$localRecipes[activeRecipeId]=rec} rec={$localRecipes[activeRecipeId]}/>
            {#if showCloseModalFor!==undefined}
                <div class="modal" >
                {$localRecipes[showCloseModalFor] && $localRecipes[showCloseModalFor].title} has changed, close and lose changes?
                <button on:click={()=>closeRec(showCloseModalFor,true)}>
                    Close anyway, I don't care about my changes
                </button>
                <button on:click={()=>showCloseModalFor=undefined}>
                    Oh wait, nevermind, I'm so sorry!
                </button>
                </div>
            {/if}
        </div>
    </div>
    {/if}
</div>
<style>

 .modal {
     /* fix me later... */
     position: fixed;
     width: 400px;
     height: 400px;
     background-color: white;
     top: calc(50vh - 200px);
     left: calc(50vw - 200px);
     box-shadow: 3px 3px #5555;
     border: 1px solid white;
     border-radius: 10px;
 }
 
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
