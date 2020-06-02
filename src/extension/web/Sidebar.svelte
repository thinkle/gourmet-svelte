<script>
 import Tagger from './Tagger.svelte';
 import Views from './SidebarRecipeViews.svelte';
 import {onMount} from 'svelte';
 import {listenToExtension} from '../messaging/polling.js'
 import {backgroundParsePage,backgroundClearAll} from '../messaging/parsing.js';

 import IconButton from '../../widgets/IconButton.svelte';
 import JsonDebug from '../../widgets/JsonDebug.svelte';
 import Whisk from '../../widgets/WhiskLogo.svelte';

 import {parseData} from '../../importer/importer.js';

 // our data...
 let parsed;
 let recipe;

 // our state
 let ready;
 let firstConnect = true;
 // promises
 let parsing;
 
 onMount(
     ()=>{
         let poller
         console.log('Set up poller!');
         poller = listenToExtension(
             (msg)=>{
                 console.log('Got poller message!',msg);
                 parsed = msg.parsed
                 if (firstConnect) {
                     if (Object.keys(parsed).length < 2 ) {
                         autoparsePage()
                     }
                     firstConnect = false;
                 }
             }
         );
         return function cleanUp () {
             console.log('disconnecting poller');
             poller.disconnect();
         }
     }
 );

 function autoparsePage () {
     parsing = backgroundParsePage.send(true);
 }


 $: recipe = parsed && parseData(parsed);
 $: ready = recipe && recipe.ingredients.length > 0;
 let tagMode = false;
 let forceTagMode;
 $: tagMode = forceTagMode || alreadyAutoTagged && !ready;
 let alreadyAutoTagged = false;
 function setTagged () {alreadyAutoTagged=true; parsing=undefined; return 'Tried to read the recipe'}
 function turnOnTagMode () {tagMode=true; return 'Better mark it up by hand now'}
</script>
<section>
<h2>Gourmet</h2>
{#if parsed && parsed.pageInfo}
    <p>Importing {parsed.pageInfo.title}</p>
{/if}
{#if !ready}
    {#if parsing}
        {#await parsing}
            Seeing what we can read automagically...
        {:then data}
            Done parsing, let me read this thing...
            <JsonDebug data="{data}"/>
            {setTagged()}
        {:catch err}
            <JsonDebug data="{err}"/>
        {/await}
    {:else if !alreadyAutoTagged}
        <IconButton icon="spy" on:click={autoparsePage}>Read Recipe</IconButton>
    {:else}
        <p>Apparently, we couldn't tag the recipe.</p>
        {turnOnTagMode()}
    {/if}
{/if}
{#if !ready && !tagMode}
    <Whisk size="200" />
{/if}
{#if ready}
    {#if tagMode}
        <span on:click="{()=>forceTagMode=false}">Switch to Viewing Recipe</span>
    {:else}
        <span on:click="{()=>forceTagMode=true}">Mark Up Recipe/Edit Mark-Up</span>
    {/if}
    {#if !tagMode}
        <Views recipe={recipe}/>
        <JsonDebug data="{recipe}"/>
    {:else if tagMode}
        <Tagger parsed={parsed}/>
        Tag that baby up!
    {/if}
{/if}
<JsonDebug data="{parsed}"/>
<spacer>
</section>

<style>
 section {
     height: 90vh;
     overflow-y: scroll;
 }
 spacer {
     height: 10vh;
 }
 span:hover {
     text-decoration: underline;
 }
</style>
    
