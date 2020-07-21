<script>
 import {recipeActions,recipePage,storedRecipes} from '../stores/recipeStores.js';
 import {exportRecipes} from '../exporters/'
 import {connectedRemote} from '../data/api.js';
 import {tick} from 'svelte';
 import {
     WhiskLogo,
     IconButton,
     DownloadButton
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


 let exporting
 let progmsg
 function startBackupExport () {
     console.log('EXPSTART BACKUP')
     exporting = async function () {
         console.log('EXPgetting loader');
         let recLoader = await recipeActions.getInfiniteRecipes();
         progmsg = 'Loading recipes...';
         console.log('Loaded first set...',recLoader,$recipePage);
         while (!recLoader.done) {
             await recLoader.more()
             console.log('EXPloading more...');
             progmsg = `Loaded ${$recipePage.length} recipes...`;
         }
         // Got 'em all...
         console.log('EXPgot em all...');
         let recipes = $recipePage.map((id)=>$storedRecipes[id]);
         progmsg = 'Finished loading recipes, converting... (be patient)'
         await tick();
         console.log('EXP export to new file format...')
         let exportedJson = exportRecipes(recipes,'gourmet-json');
         progmsg = 'Done converting, preparing file... '
         await tick();
         console.log('Complete process',exportedJson);
         return JSON.stringify(exportedJson,undefined,2); // indent
     }()
 }


</script>

<div>
    
    <h2>Import/Export</h2>

    <h3>Import File</h3>
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


    <h3>Export Backup</h3>
    {#if !exporting}
        <IconButton icon="download" on:click="{startBackupExport}">
            Backup Recipe Database as File
        </IconButton>
        <!-- <IconButton icon="download" on:click="{startBackupExport}">
             Download JSON-LD version of Recipes
             </IconButton> -->
    {:else}
        {#await exporting}
            <p>Generating file... Hard at work</p>
            <WhiskLogo autorestart="{true}"/>
        {:then complete}
            <DownloadButton
                type="application/json"
                filename="recipes.grmt-web.json"
                content="{complete}">
                Download File
            </DownloadButton>
        {/await}
    {/if}
    
</div>
<style>
 h2 {
     font-weight: bold;
     font-size: 2rem;
     margin-bottom: 1rem;
 }
 h3 {
     font-weight: bold;
     font-size: 1.5rem;
     margin-top: 1rem;
 }
 div {
     min-width: 80vw;
 }
 input {
     display: none;
 }
</style>
