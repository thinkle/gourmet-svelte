<script>
 let chromeExtensionId = 'aaaloblfbkmkhcpbandokicnfpifbmlj'
                         //'aaaloblfbkmkhcpbandokicnfpifbmlj'
 let messagePromise;

 const talkToChrome = () => {
     messagePromise = new Promise((resolve,reject)=>{
         chrome.runtime.sendMessage(
             chromeExtensionId,
             {message:'hello',
             origin:'sidebar'},
             (response)=>{
                 if (response) {
                     console.log('Got response',response);
                     resolve(response);
                 }
                 else {
                     console.log('Error talking to chrome',chrome.runtime.lastError);
                     reject(chrome.runtime.lastError)
                 }
             }
         );
     });
 }
</script>

<h2>Hello World</h2>
<p>This is a sidebar</p>
<button on:click="{talkToChrome}">Talk to the extension</button>
{#if messagePromise}
    {#await messagePromise}
        Talking to the google...
    {:then json}
        Cool: got data {json}
        Stringify?
        {JSON.stringify(json)}
    {:catch error}
        Bummer: error: {error}
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
