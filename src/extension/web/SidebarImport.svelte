<script>
 import IconButton from '../../widgets/IconButton.svelte';
 import ParseStatus from './ParseStatus.svelte';
 export let pageInfo
 import {backgroundParsePage,backgroundClearAll} from '../messaging/parsing.js';

 let parsing;
 let clearing;
 let imported = false;

 function doSilentParseRecipe () {
     console.log('parse!');
     parsing = backgroundParsePage.send(true); // silent mode
 }

 function doParseRecipe () {
     console.log('parse!');
     parsing = backgroundParsePage.send(false); // regular mark-up mode
 }

 function doClearParsed () {
     console.log('Clearing parsed...');
     clearing = backgroundClearAll.send(); // silent mode
     imported = false;
 }

</script>
<div>
    {#if !imported}
        <p>Import {pageInfo.title}?</p>
    {/if}
    <IconButton icon="spy" on:click={doSilentParseRecipe}>Silently Fetch Recipe</IconButton>
    <IconButton icon="import_export" on:click={doParseRecipe}>Loudly Mark Up Recipe</IconButton>
    <IconButton icon="delete" on:click={doClearParsed}>Clear All Tags</IconButton>
    <ParseStatus/>
    {#if parsing}
        {#await parsing}
            Parsing...
        {:then json}
            Done parsing!
            <p>You'll see the items highlighted on the recipe itself (hopefully: styling may vary depending on the page -- we do our best!</p>
            {JSON.stringify(json)}
            <IconButton on:click={()=>parsing=undefined} bare={true} icon="close"></IconButton>
            {imported = true}
        {:catch error}
            <p>Bummer, something went wrong :( Try again?
            </p>
            {error}
        {/await}
        <p>Tag by hand?</p>
    {/if}
    {#if clearing}
        {#await clearing}
            Clearing recipe...
        {:then json}
            Cleared {json}
            <IconButton on:click={()=>clearing=undefined} bare={true} icon="close"></IconButton>
        {:catch error}
            <p>Bummer, something went wrong clearing :( Try again?
            </p>
            {error}
        {/await}
    {/if}
    
</div>
<style>
 .link {
     font-weight: bold
 }
 .link a {
     visibility: hidden;
     position: absolute;
     top: 30px;
     left: 5px;
     background-color: yellow;
 }
 .link:hover a {
     visibility: visible
 }
</style>
