<script>
 import Tagger from './Tagger.svelte';
 import {Tab,
        Tabs,
        IconButton,
        JsonDebug,
        WhiskLogo
        } from '../../widgets/';

 import Views from './SidebarRecipeViews.svelte';
 import {onMount,setContext,getContext} from 'svelte';
 import {writable} from 'svelte/store';
 import {backgroundParsePage,backgroundClearAll} from '../messaging/parsing.js';

 import {parseData} from '../../importer/importer.js';
 import {helloWorld,sendParsedToWeb,sendSelectionToWeb} from '../messaging/webMessages.js';
 import {sendHighlightToWeb,
        backgroundHighlightIng} from '../messaging/highlighterMessages.js';

 // our data...
 let parsed;
 let recipe;

 // our state
 let firstConnect;

 // promises
 let parsing;
 let selectionActive;
 let tb = getContext('toolbar');
 let highlightedIngredient = writable({active:[]});
 let justSetHighlightedIngredient
 setContext('highlightedIngredient',highlightedIngredient);
 if (tb) tb.hideWhenLoggedIn()
 /*  let hello = 'I sure hope they say hello...' */

 highlightedIngredient.subscribe(
     ($hi)=>{
         console.log('Sidebar sees highlight update',$hi,justSetHighlightedIngredient);
         if (!justSetHighlightedIngredient) {
             // ingredient highlight set from sidebar... send
             // to extension...
             console.log('Sending to BG')
             backgroundHighlightIng.send(
                 $hi
             );
         } else {
             console.log('No need to send, we just got this from BG')
             justSetHighlightedIngredient = false;
         }
     }
 );

 onMount(
     ()=>{
         /* let helloListener = helloWorld.receive(
          *     (message,port)=>{
          *         console.log('Got hello',message,port)
          *         hello = message;
          *     }
          * ); */
         let disconnectHighlightListener = sendHighlightToWeb.receive(
             (message,port)=>{
                 console.log('Cool, got message',message,port,'set just set=>true');
                 justSetHighlightedIngredient = true;
                 $highlightedIngredient = message;
             }
         );
         let disconnectParseListener = sendParsedToWeb.receive(
             (message,port)=>{
                 console.log('Got parsed message',message,port)
                 parsed = message;
                 if (!firstConnect) {
                     // add if statement to check if we have data...
                     console.log('Autoparse!');
                     autoparsePage();
                 }
                 firstConnect = true;
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
             disconnectHighlightListener();
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
    <Tabs sticky="{true}">
        <Tab active="{tagMode}" on:click="{()=>tagMode=true}">Tag</Tab>
        <Tab active="{!tagMode}" on:click="{()=>tagMode=false}">View</Tab>
    </Tabs>

    {#if parsed && parsed.pageInfo}
        <p>Importing {parsed.pageInfo.title}</p>
    {/if}

    {#if parsing}
        {#await parsing}
            Scanning page for recipe...
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
    {/if}
    {#if tagMode}
        <Tagger {selectionActive} parsed={parsed}/>
    {:else}
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
    
