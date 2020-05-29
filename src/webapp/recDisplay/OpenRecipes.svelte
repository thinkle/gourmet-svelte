<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(BUILD_MS);
 import {flip} from 'svelte/animate';
 import { quintOut } from 'svelte/easing';
 import Recipe from './Recipe.svelte'
 import IconButton from '../../widgets/IconButton.svelte';
 import {openLocalRecipes,localRecipes,recipeState,recipeActions} from '../../stores/recipeStores.js';
 export function open (id) {
     hide = false;
     if (id!==undefined) {
         activeRecipeId = id;
     }
 }
 function getTabTitle (id) {
     return $localRecipes[id].title && $localRecipes[id].title.substr(0,30) || '???'; // fixme
 }

 let activeRecipeId
 let hide = false;

 function openOne () {
     activeRecipeId = $openLocalRecipes[0]
     console.log('Got open recs',$openLocalRecipes);
 }

 $: {if (!activeRecipeId && $openLocalRecipes.length && $openLocalRecipes[0]) {
     openOne()
    }}
            console.log('Got recs',$openLocalRecipes);

 let showCloseModalFor

 function closeRec (id,confirmed=false) {
     
     showCloseModalFor = undefined;
     if (!$recipeState[id]||!$recipeState[id].edited||confirmed) {
         let index = $openLocalRecipes.indexOf(id);
         localRecipes.close(id);
         if (index > 0) {
             index = index + 1;
         }
         activeRecipeId = $openLocalRecipes[index]; // change ID
     } else {
         console.log('Set closed modal!');
         showCloseModalFor = id;
     }
 }

 function onOpenSubRec (id) {
     console.log('Request to open recipe!',id);
     recipeActions.openRecipe(id);
 }

</script>
{#if !hide && $openLocalRecipes.length > 0}
    <div class="screen" on:click="{()=>{hide=true}}">
        
    </div>
{/if}
<div class="fixedContainer">
    {#if ($openLocalRecipes.length > 0)}
        <div class="tabbox" class:hidden={hide}>
            <div class="tabs">
                {#each $openLocalRecipes as id (id)}
                    <span
                        animate:flip={{delay:100,duration:250,easing:quintOut}}
                        class:active={activeRecipeId==id} on:click={()=>activeRecipeId=id}>
                        <div class='close'>
                            <IconButton bare={true} small={true} on:click={()=>window.open(`/rec/${id}`,'_blank')} icon='open_in_new'/>
                            <IconButton bare={true} small={true} on:click={()=>{console.log('close fired',id);closeRec(id)}} icon='close'/>
                        </div>
                        {getTabTitle(id)}
                        
                    </span>
                {/each}
                <div class='toggle'>
                    <IconButton on:click="{()=>hide=!hide}"
                                icon={hide&&"expand_more"||"expand_less"}
                    >
                        {#if hide}
                            Show Recipes
                        {:else}
                            Hide Recipes
                        {/if}
                    </IconButton>
                </div>
            </div> <!-- close tabs -->

            <div class="content">
                <!--  $openLocalRecipes.indexOf(activeRecipeId)>-1 &&  ?? -->
                {#if $localRecipes[activeRecipeId]}
                    <Recipe
                        rec="{$localRecipes[activeRecipeId]}"
                        {onOpenSubRec}
                        onChange="{(rec)=>{
                                  console.log('OpenRecipes got onChange from recipe!');
                                  $localRecipes[rec.id]=rec;
                                  }}"
                    />
                {:else}
                    {$openLocalRecipes.length>0 && openOne()}                    
                {/if}
                <!-- Are you sure you want to close modal... -->
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
            </div> <!-- close content -->

        </div> <!-- close tabbox -->

    {/if}
</div>
<style>

 .screen {
     background-color: #9995;
     position: fixed;
     top: 0;
     left: 0;
     width: 100%;
     height: 100vh;
 }

 .tabbox {
     width : 70%;
     max-width: 1400px;
     min-width: 800px;
     margin: auto;
 }

 .tabbox.hidden {
     width : 95%;
 }

 .content {
     height: 90vh;
     padding: 2em;
 }

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
     background-color: white;
 }

 .fixedContainer {
     position: fixed;
     top: 0;
     left: 0;
     width: 100%;
 }

 .tabs {
     display: flex;
     flex-direction: row;
     background-color: white;
 }

 .hidden .tabs {
     background-color: transparent;
 }

 .tabs span {
     padding: 0.5em;
     border-bottom : 1px solid var(--light-underline);
     margin-right: 3px;
     font-weight: 300; /* light */
 }

 .tabs span:hover {
     border-bottom: 3px solid var(--medium-underline);
     background-color: var(--light-bg);
     color: var(--light-fg);
     font-weight: 500;
 }
 .toggle {
     margin-left: auto;
 }

 .tabs .active {
     border-bottom: 3px solid var(--heavy-underline);
     font-weight: 500;
 }
 .tabs span .close {
     float : right;
 }
</style>
