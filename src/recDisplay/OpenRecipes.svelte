<script>
 import router from 'page';
 import {registerBuild} from '../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 
 export function open (id, editMode=false) {
     if (isNaN(Number(id))) {
         console.log("WARNING: OPEN CALLED WITH NON-ID?",id);
     }
     hide = false;
     if (id!==undefined) {
         activeRecipeId = id;
         editOnOpen[id] = editMode
         if (editMode && recComponents[id]) {
             // already have a component... force it into edit             
             recComponents[id].setEditMode(editMode);
         }
     } else {
         console.log('Weird, got no id :(',id,editMode)
     }
     if (onOpen) {
         onOpen(id,editMode)
     }
     
 }
 export let openIDs
 export let activeID
 export let onOpen
 export let hide

 $:console.log('OpenRecipes got openIDs',openIDs)
 $:console.log('OpenRecipes got activeID',activeID)

 import {shoppingList} from '../stores/shoppingStores.js';
 import {getContext,onMount} from 'svelte';
 import {fade,slide} from 'svelte/transition';
 import {flip} from 'svelte/animate';
 import { quintOut } from 'svelte/easing';
 import Recipe from './rec/Recipe.svelte';
 import {
     Bar,
     Button,
     IconButton,
     Tabs,
     Tab,
     FullHeight,
     LazyIf,
     Modal,
     ModalLauncher}  from '../widgets/';
 import {openLocalRecipes,localRecipes,recipeState,recipeActions} from '../stores/recipeStores.js';
 import {getStyle} from './rec/colors.js';
 function getTabTitle (id) {
     return $localRecipes[id].title && $localRecipes[id].title.substr(0,30) || 'Untitled'; // fixme
 }

 let activeRecipeId

 if (!openIDs) {
     openIDs = $openLocalRecipes
 } else {
     for (let id of openIDs) {
         if (!$localRecipes[id]) {
             console.log('Opening recipe from prop...');
             localRecipes.open(id);
         }
     }
 }

 

 let recComponents = {}
 let editOnOpen = {}

 function openOne () {
     activeRecipeId = $openLocalRecipes[0]
 }

 $: activeRecipeId && router(`/main/OpenRecipes/${$openLocalRecipes.join(',')}#${activeRecipeId}`)

 $: {if (!activeRecipeId && $openLocalRecipes.length && $openLocalRecipes[0]) {
     openOne()
    }
    }

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

</script>

<LazyIf condition="{($openLocalRecipes.length > 0) && !hide}">
    <Tabs sticky={true} nowrap={true} standalone="{true}">
        {#each $openLocalRecipes as id (id)}
            <div
                animate:flip="{{delay:100,duration:250,easing:quintOut}}"
                style="{getStyle($localRecipes[id])}"
            >
                <Tab
                    active="{activeRecipeId==id}" on:click="{()=>activeRecipeId=id}"
                >
                    <span class="tabtitle">{$localRecipes[id].title||'Untitled'}</span>
                    <div class='close'>
                        <IconButton bare="{true}" small="{true}" on:click="{()=>{shoppingList.addRecipe(id)}}" icon='shopping_cart'/>
                        <IconButton bare="{true}" small="{true}" on:click="{()=>window.open(`/rec/${id}`,'_blank')}" icon='open_in_new'/>
                        <IconButton bare="{true}" small="{true}" on:click="{()=>{closeRec(id)}}" icon='close'/>
                    </div>
                </Tab>
            </div>
        {/each}
    </Tabs> <!-- close tabs -->
    <FullHeight>
        <!--  $openLocalRecipes.indexOf(activeRecipeId)>-1 &&  ?? -->
        {#each Object.keys($localRecipes) as id (id)}
            <LazyIf condition="{id==activeRecipeId}">
                <Recipe
                    bind:this="{recComponents[id]}"
                    rec="{$localRecipes[id]}"
                    {onOpenSubRec}
                    onChange="{(rec)=>{
                              console.log('OpenRecipes got change!',rec);
                              $localRecipes[id]=rec;
                              }}"
                    onEditToggle="{(val)=>editOnOpen[id]=val}"
                    editOnOpen="{editOnOpen[id]}"
                />
            </LazyIf>
        {/each}
        <!-- 
        {#if $localRecipes[activeRecipeId]}
            <Recipe
                bind:this="{recComponents[activeRecipeId]}"
                rec="{$localRecipes[activeRecipeId]}"
                {onOpenSubRec}
                onChange="{(rec)=>{
                          console.log('OpenRecipes got change!',rec);
                          $localRecipes[rec.id]=rec;
                          }}"
                onEditToggle="{(val)=>editOnOpen[activeRecipeId]=val}"
                editMode="{editOnOpen[activeRecipeId]}"
            />
        {:else}
            {$openLocalRecipes.length>0 && openOne()}                    
        {/if} -->
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
    </FullHeight>
    
</LazyIf>

<style>

 .tabtitle {
     max-width: 8em;
     overflow: hidden;
     text-overflow: ellipsis;
 }
 
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
 .toggle {
     margin-left: auto;
 }

</style>
