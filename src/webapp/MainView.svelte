<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import RecipeList from './recDisplay/RecipeList.svelte';
 import ModalLauncher from '../widgets/ModalLauncher.svelte';
 import OpenRecipes from './recDisplay/OpenRecipes.svelte';
 import Status from '../widgets/Status.svelte';
 import IconButton from '../widgets/IconButton.svelte';
 import {connected,
        localRecipes,
        openLocalRecipes,
        recipeActions} from '../stores/recipeStores.js';
 let opener;
 let syncingPromise


 // Fix me
 import {storedRecipes} from '../stores/recipeStores.js';
 import JsonDebug from '../widgets/JsonDebug.svelte';

 import {getContext,onMount} from 'svelte';
 import {writable} from 'svelte/store'
 let hideOpenButton = writable(true);
 
</script>

<div>
    {#if $connected}
        <br>
        <button
            on:click="{async ()=>opener.open(await recipeActions.createRecipe())}">
            New Recipe
        </button>
    {/if}
    <div>
        <OpenRecipes bind:this={opener}/>
    </div>    
    <RecipeList
        onRecipeClick="{
                       (id)=>localRecipes.open(id).then(()=>opener.open(id))
                       }"
    />
    <Status/>
    <button on:click="{()=>syncingPromise=recipeActions.doSync()}">Sync with Server?</button>
    <button on:click="{()=>syncingPromise=recipeActions.doSync(true)}">Small Sync</button>
    {#if syncingPromise}
        {#await syncingPromise}
            Syncing...
        {:then json}
            Cool, done syncing! {JSON.stringify(json)}
        {:catch error}
            Failed :( {console.log(error)} {error}
        {/await}
    {/if}   
</div>
{#if DEV}
<div>
    Stored<JsonDebug data={$storedRecipes}/>
    Local<JsonDebug data={$localRecipes}/>
</div>
{/if}
<style>
</style>
