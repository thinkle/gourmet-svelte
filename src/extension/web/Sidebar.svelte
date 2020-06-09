<script>
 import Tagger from './Tagger.svelte';
 import {Tab,
        Tabs,
        IconButton,
        JsonDebug,
        WhiskLogo
        } from '../../widgets/';

 import Views from './SidebarRecipeViews.svelte';
 import {onMount,getContext} from 'svelte';
 import {backgroundParsePage,backgroundClearAll} from '../messaging/parsing.js';

 import {parseData} from '../../importer/importer.js';
 import {helloWorld,sendParsedToWeb,sendSelectionToWeb} from '../messaging/webMessages.js';


 // our data...
 let parsed;
 let recipe;

 // our state
 let firstConnect = true;
 // promises
 let parsing;
 let selectionActive;
 let tb = getContext('toolbar');
 if (tb) tb.hideWhenLoggedIn()
 /*  let hello = 'I sure hope they say hello...' */
 onMount(
     ()=>{
         /* let helloListener = helloWorld.receive(
          *     (message,port)=>{
          *         console.log('Got hello',message,port)
          *         hello = message;
          *     }
          * ); */
         let disconnectParseListener = sendParsedToWeb.receive(
             (message,port)=>{
                 console.log('Got parsed message',message,port)
                 parsed = message;
             }
         );
         let disconnectSelectionListener = sendSelectionToWeb.receive(
             (message,port)=>{
                 console.log('Got selection message',message,port)
                 selectionActive = message;
             }
         );
         return ()=>{
             disconnectSelectionListener();
             disconnectParseListener();
         }
     }
 );

 function autoparsePage () {
     parsing = backgroundParsePage.send(true);
 }


 $: recipe = parsed && parseData(parsed);

 let tagMode = false;
 let alreadyAutoTagged = false;
 function setTagged () {alreadyAutoTagged=true; parsing=undefined; return 'Tried to read the recipe'}
 function turnOnTagMode () {tagMode=true; return 'Better mark it up by hand now'}
</script>

<section>
    <h2>
        Gourmet
    </h2>
    
    <Tabs sticky="{true}">
        <Tab active="{tagMode}" on:click="{()=>tagMode=true}">Tag</Tab>
        <Tab active="{!tagMode}" on:click="{()=>tagMode=false}">View</Tab>
    </Tabs>

    {#if parsed && parsed.pageInfo}
        <p>Importing {parsed.pageInfo.title}</p>
    {/if}

    {#if parsing}
        {#await parsing}
            Seeing what we can read automagically...
            <WhiskLogo size="200" />
        {:then data}
            Done parsing, let me read this thing...
            <JsonDebug data="{data}"/>
            {setTagged()}
        {:catch err}
            <JsonDebug data="{err}"/>
        {/await}
        <IconButton icon="close" on:click="{()=>parsing=undefined}">Done</IconButton>
    {/if}
    {#if !alreadyAutoTagged}
        <IconButton icon="spy" on:click={autoparsePage}>Read Recipe</IconButton>
    {:else}
        <p>Apparently, we couldn't tag the recipe :(</p>
    {/if}
    {#if tagMode}
        Tag that baby up!
        <Tagger {selectionActive} parsed={parsed}/>
    {:else}
        View that thing!
        <Views recipe={recipe}/>
        <JsonDebug data="{recipe}"/>
    {/if}
    <JsonDebug data="{parsed}"/>
    <spacer></spacer>
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
 .tabs {
     display: flex;
     flex-direction: row;
     background-color: white;
     position: sticky;
     top: 0;
     background-color: white;
     width: 100%;
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

</style>
    
