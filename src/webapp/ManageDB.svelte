<script>
 import {connected} from '../stores/recipeStores.js';
 import dexieApi from '../data/dexieApi.js';
 import api from '../data/api.js';
 import {JsonDebug,Button} from '../widgets/';

 let action
 let subAction
 let actionPage
 async function fixRecipes (page=undefined) {
     // We just get the recipes and then update... this passes them all through
     // whatever our current validate code is, so if recipes are somehow invalid,
     // this will "fix" them.
     let response = await dexieApi.getRecipes({page});
     if (response.result) {
         subAction = await(dexieApi.updateRecipes(response.result))
         if (!response.last) {
             actionPage = response.nextPage
             fixRecipes(response.nextPage)
         }
     }
 }
 
</script>
<div>
{#if $connected}
    <div>
        <Button on:click="{()=>action=fixRecipes()}">Validate All Recipes</Button>
    </div>
{:else}
    Still connecting...
{/if}
{#if actionPage}
    On page {actionPage}
{/if}
{#if action}
    {#await action}
        Doing something...
        {:then data}
        Action complete!
        <JsonDebug data="{data}"/>
    {:catch err}
        <JsonDebug data="{err}"/>
    {/await}
{/if}
{#if subAction}
    {#await subAction}
        Doing something...
    {:then data}
        Action complete!
            <JsonDebug data="{data}"/>
    {:catch err}
            <JsonDebug data="{err}"/>
    {/await}
{/if}
</div>

    <style>
     div {
         width: 30em;
         margin: auto;
     }
    </style>
