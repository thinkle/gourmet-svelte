<script>
 import {onMount} from 'svelte';
 import {listenToExtension} from '../messaging/polling.js'
 let statusPromise;
 let pollAgain = true;
 let parsed
 let updateCount = 0;

 import RecDef from '../../common/RecDef.js';
 let poller;
 onMount(
     ()=>{
         poller = listenToExtension(
             (msg)=>{
                 console.log('Got poller message!',msg);
                 parsed = msg.parsed
                 updateCount += 1;
                 updateParsed(parsed)
             }
         );
         return function cleanUp () {
             console.log('disconnecting');
             poller.disconnect();
         }
     }
 );
 
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
 }
 
let show=true;
</script>
<div>
    <!-- fix me: import  -->
    {#if poller}Connected to extension...{/if}
    <p>{updateCount} responses</p>
    <p>{tagCount} items tagged</p>
    <ul>
    {#if parsed}
    {#each RecDef.importProps as prop}
        {#if tags[prop.name]}
            <li>{prop.label} : {tags[prop.name]}</li>
        {/if}
    {/each}
    {/if}

    {#if show}
        <button on:click={()=>show=false}>Hide</button>
        {JSON.stringify(parsed)}
    {:else}
        <button on:click={()=>show=true}>Show JSON</button>
    {/if}
    </ul>
</div>
