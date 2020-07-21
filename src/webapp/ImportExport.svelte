<script>
 import {recipeActions} from '../stores/recipeStores.js';
 import {connectedRemote} from '../data/api.js';
 import {tick} from 'svelte';
 import {
     IconButton
 } from '../widgets/';

 let fileInput
 let importing
 const DONE = 'Done!'

 async function updateFile () {
     const file = event.target.files[0];
     const reader = new FileReader();
     const text = await file.text()
     let json
     try {
         json = JSON.parse(text)
         importing = "In progress...";
         await tick();
     } catch (err) {
         error = 'Invalid JSON file'
         console.log('Unable to parse json from ',text);
         return
     }
     console.log('Got JSON!',json)
     await recipeActions.importRecipes(json);
 }

</script>

<div>
    
    <h2>Import/Export</h2>
    <div>Import File</div>
    {#if $connectedRemote}
        {#if !importing}
            <label class="file-input-wrap">
                <input
                    bind:this="{fileInput}"
                    accept="*"
                    type="file"
                    on:change="{updateFile}"
                >
                {#if fileInput}
                    <IconButton icon="cloud_upload" on:click="{()=>fileInput.click()}">Upload Recipes</IconButton>
                {/if}
            </label>
        {:else if importing==DONE}
            <p>Done importing your recipes!</p>
            <IconButton icon="redo" on:click="{()=>importing=false}">Import more?</IconButton>
        {:else}
            <p>Importing your recipes... this may take a bit...</p>
            <p>Also... haven't quite made it note when we are finished yet.</p>
        {/if}
    {:else}
        No user logged in ?? Not connected yet
    {/if}
</div>
<style>
 div {
     min-width: 80vw;
 }
 input {
     display: none;
 }
</style>
