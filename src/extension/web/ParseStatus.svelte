<script>
 import {onMount} from 'svelte';
 import {parseData} from '../../importer/importer.js';
 import Recipe from '../../webapp/recDisplay/Recipe.svelte'
 import {listenToExtension} from '../messaging/polling.js'
 let statusPromise;
 let pollAgain = true;
 let parsed
 let updateCount = 0;
 import {recipeActions,connected,storedRecipes} from '../../stores/recipeStores.js';
 import IconButton from '../../widgets/IconButton.svelte';
 let creating;

 function doCreateRecipe () {
     creating = recipeActions.createRecipe(recipe);    
 }


 
 import RecDef from '../../common/RecDef.js';
 let poller;
 onMount(
     ()=>{
         console.log('Set up poller!');
         poller = listenToExtension(
             (msg)=>{
                 console.log('Got poller message!',msg);
                 parsed = msg.parsed
                 updateCount += 1;
                 updateParsed(parsed)
             }
         );
         return function cleanUp () {
             console.log('disconnecting poller');
             poller.disconnect();
         }
     }
 );

 let recipe
 let tagCount = 0;
 let tags = {}
 let tagNames = [];

 function updateParsed () {
     tags = {}
            tagCount = 0
            let items = Object.values(parsed);
            for (let tag of items) {
                if (tag.tag) {
                    if (!tags[tag.tag]) {
                        tags[tag.tag] = 1;
                    }
                    else {
                        tags[tag.tag] += 1;
                    }
                    tagCount += 1;
                }
            }
            recipe = parseData(parsed)
            
 }
         
 let show=false;
 let showRec = false;
</script>
<div>
    {#if connected && recipe}
        <IconButton icon="save" on:click={doCreateRecipe}>Save Recipe to Collection</IconButton>
    {:else if recipe}
        Not connected?
    {/if}
    {#if creating}
        {#await creating}
            Creating recipe in database...
        {:then recipe}
            Created recipe!
            ID={recipe.id};
        {:catch error}
            Unable to create recipe {error}
        {/await}
    {/if}
    <!-- fix me: import  -->
    {#if poller}Connected to extension...{/if}
    <p>{updateCount} responses</p>
    <p>{tagCount} items tagged</p>
    {#if recipe}
        {#if showRec}
            <button on:click={()=>showRec=false}>Hide Rec</button>
            <Recipe editable={false} rec={recipe}/>
            Recipe: {JSON.stringify(recipe)}
        {:else}
            <button on:click={()=>showRec=true}>Show Rec</button>
        {/if}
    {/if}
    {#if parsed}
        <ul>
            {#each RecDef.importProps as prop}
                {#if tags[prop.name]}
                    <li>{prop.label} : {tags[prop.name]}</li>
                {/if}
            {/each}
        </ul>
    {/if}
    {#if show}
        <button on:click={()=>show=false}>Hide</button>
        {JSON.stringify(parsed)}
    {:else}
        <button on:click={()=>show=true}>Show JSON</button>
    {/if}
</div>
<style>
 div {
     border : 2px solid blue;
 }
</style>
