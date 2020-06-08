<script>
 export function open (id) {
     hide = false;
     if (id!==undefined) {
         activeRecipeId = id;
     }
 }
 import {shoppingList} from '../stores/shoppingStores.js';
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import {getContext,onMount} from 'svelte';
 import {fade,slide} from 'svelte/transition';
 import {flip} from 'svelte/animate';
 import { quintOut } from 'svelte/easing';
 import Recipe from './rec/Recipe.svelte'
 import Button from '../widgets/Button.svelte';
 import IconButton from '../widgets/IconButton.svelte';
 import Tabs from '../widgets/Tabs.svelte';
 import Tab from '../widgets/Tab.svelte';
 import Modal from '../widgets/Modal.svelte';
 import ModalLauncher from '../widgets/ModalLauncher.svelte';
 import {openLocalRecipes,localRecipes,recipeState,recipeActions} from '../stores/recipeStores.js';
 function getTabTitle (id) {
     return $localRecipes[id].title && $localRecipes[id].title.substr(0,30) || 'Untitled'; // fixme
 }

 let activeRecipeId
 let hide = false;

 function openOne () {
     activeRecipeId = $openLocalRecipes[0]
 }

 $: {if (!activeRecipeId && $openLocalRecipes.length && $openLocalRecipes[0]) {
     openOne()
    }}

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
         showCloseModalFor = id;
     }
 }

 function onOpenSubRec (id) {
     recipeActions.openRecipe(id);
 }


 let toolbar = getContext('toolbar');
 let toolbarItem;
 $: {
     toolbarItem && $openLocalRecipes.length>=0 && toolbarItem.show()
 }
 $: {
     toolbarItem && $openLocalRecipes.length<=0 && toolbarItem.hide()
 }

 onMount(
     ()=>{
         if (!toolbar) {
             console.log('No toolbar :(')
             return
         }
         toolbarItem = toolbar.addItem({
             content : 'Open Recipes',
             modalVisible : false,
             key:'OpenRecipes',
             props : {
                 icon : 'expand_more',
             },
             'onClick' : open
         });
         return toolbarItem.onUnmount
     }
 );

 $: {
     if (toolbarItem)
     {if (hide) {
         toolbarItem.hideModal()
     } else {
         toolbarItem.showModal()
     }
     };
 }

</script>
{#if !hide && $openLocalRecipes.length > 0}
    <div class="screen" on:click="{()=>{hide=true}}">
        
    </div>
{/if}


{#if ($openLocalRecipes.length > 0) && !hide}
    <Modal key="OpenRecipes" onClose="{()=>hide=true}" showClose="{false}" width="1200px" maxWidth="96em">
        <Tabs sticky={true}>
            {#each $openLocalRecipes as id (id)}
                <div
                    animate:flip="{{delay:100,duration:250,easing:quintOut}}">
                    <Tab
                        active="{activeRecipeId==id}" on:click="{()=>activeRecipeId=id}">
                        <div class='close'>
                            <IconButton bare="{true}" small="{true}" on:click="{()=>window.open(`/rec/${id}`,'_blank')}" icon='open_in_new'/>
                            <IconButton bare="{true}" small="{true}" on:click="{()=>{shoppingList.addRecipe(id)}}" icon='shopping_cart'/>
                            <IconButton bare="{true}" small="{true}" on:click="{()=>{closeRec(id)}}" icon='close'/>
                        </div>
                        {getTabTitle(id)}
                    </Tab>
                </div>
            {/each}
            <div class='toggle'>
                <IconButton
                    bare="{true}"
                    on:click="{()=>hide=!hide}"
                    icon="{hide&&'expand_more'||'expand_less'}"
                >
                </IconButton>
            </div>
        </Tabs> <!-- close tabs -->
        
        <div class="content">
            <!--  $openLocalRecipes.indexOf(activeRecipeId)>-1 &&  ?? -->
            {#if $localRecipes[activeRecipeId]}
                <Recipe
                    rec="{$localRecipes[activeRecipeId]}"
                    {onOpenSubRec}
                    onChange="{(rec)=>{
                              console.log('OpenRecipes got change!',rec);
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
                    <Button on:click="{()=>closeRec(showCloseModalFor,true)}">
                        Close anyway, I don't care about my changes
                    </Button>
                    <Button on:click="{()=>showCloseModalFor=undefined}">
                        Oh wait, nevermind, I'm so sorry!
                    </Button>
                </div>
            {/if}
        </div> <!-- close content -->

</Modal>
    {/if}

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


 .content {
     height: 90vh;
     padding: 5px;
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
 .tabs .active {
     border-bottom: 3px solid var(--heavy-underline);
     font-weight: 500;
 }
 .close {
     float : right;
 }
 .toggle {
     margin-left: auto;
 }

</style>
