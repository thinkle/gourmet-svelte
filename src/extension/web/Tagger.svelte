<script>
 export let parsed;

 import RecDef from '../../common/RecDef.js';
 import JsonDebug from '../../widgets/JsonDebug.svelte';
 import IconButton from '../../widgets/IconButton.svelte';

 import {backgroundParsePage,backgroundClearAll} from '../messaging/parsing.js';

 let tags, tagCount;

 $: updateParsedSummary(parsed);
 
 function updateParsedSummary () {
     tags = {
     }
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

 let parsing;
 let clearing;
 function doParseRecipe () {
     parsing = backgroundParsePage.send(false); // regular mark-up mode
 }
 function doClearParsed () {
     console.log('Clearing parsed...');
     clearing = backgroundClearAll.send(); // silent mode
     imported = false;
 }



</script>

<p>I should really implement this</p>
<p>For now, use the right-click menu to add tags to the page.</p>
<IconButton icon="import_export" on:click={doParseRecipe}>Auto-Tag Recipe</IconButton>
<IconButton icon="delete" on:click={doClearParsed}>Clear All Tags</IconButton>
<h6>Select text, then choose:</h6>
<ul>
    {#each RecDef.importProps as prop}
        <li>
            <IconButton icon="label">{prop.label}</IconButton> {#if tags[prop.name]}({tags[prop.name]} already tagged){/if}
        </li>
    {/each}
</ul>

Tag Data<JsonDebug data="{tags}" />
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

{#if parsing}
    {#await parsing}
        Parsing...
    {:then json}
        Done parsing!
        <p>You'll see the items highlighted on the recipe itself (hopefully: styling may vary depending on the page -- we do our best!</p>
        <IconButton on:click={()=>parsing=undefined} bare={true} icon="close"></IconButton>
    {:catch error}
        <p>Bummer, something went wrong :( Try again?
        </p>
        <JsonDebug data={error}/>
    {/await}    
{/if}

<style>
    li {list-style: none}
</style>
