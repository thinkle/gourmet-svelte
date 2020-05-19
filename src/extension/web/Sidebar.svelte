<script>
 import {onMount} from 'svelte';
 import {extensionUrl} from './messages.js';
 import {backgroundGetPageInfo} from '../messaging/parsing.js';
 import SidebarImport from './SidebarImport.svelte';
 
 let messagePromise

 function doGet () {
     messagePromise = backgroundGetPageInfo.send(null);
 }

 onMount(doGet)

 let now = new Date().getTime()
 let longAgo = (now - BUILD_MS)/(1000 * 60)
</script>

<h2>Hello World BUILD_TIME {longAgo} minutes ago</h2>
<p>This is a sidebar</p>

{#if messagePromise}
    {#await messagePromise}
        <p>One second...</p>
        <p>Impatient? Give it <a on:click={doGet}>a kick</a></p>
    {:then pageInfo}
        <SidebarImport pageInfo={pageInfo} />
        Cool: got data {pageInfo}
        Stringify?
        {JSON.stringify(pageInfo)}
    {:catch error}
        <p>Error connecting. Perhaps you haven't installed the
        Chrome Extension? (in which case, I'm not sure how
            you have arrived at this page).</p>
        <p>Visit <a href={extensionUrl}>our extension page</a>
            to download the latest extension</p>
        {JSON.stringify(error)}
    {/await}
{/if}

<style>
 .app {
     margin: auto;
     max-width: 1200px;
 }
 :root {
     --grey : #727272;
     --black : #efefef;
     --white : #121212;
     --font : Futura, sans-serif;
 }
 </style>
