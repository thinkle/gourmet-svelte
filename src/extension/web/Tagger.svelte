<script>
 export let parsed;
 export let selectionActive;
 
 import RecDef from '../../common/RecDef.js';
 import {JsonDebug,
         IconButton} from '../../widgets/';
 import TagEditor from './TagEditor.svelte';

 import {backgroundParsePage,
        backgroundClearAll,
        backgroundParseSelection} from '../messaging/parsing.js';

 let tags, tagCount;

 $: parsed && updateParsedSummary(parsed);
 
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
 }

</script>

<IconButton icon="import_export" on:click={doParseRecipe}>Tag Recipe Automatically (YMMV)</IconButton>
<IconButton icon="delete" on:click={doClearParsed}>Clear All Tags</IconButton>
<h6>Tags:</h6>
<p>Select text on left to add new tags</p>
<table>
    {#each RecDef.importProps as prop}
        <tr>
            <td>
                <IconButton
                    invisible={!selectionActive}
                    icon="label"
                    left="true"
                    on:click="{
                              ()=>parsing=backgroundParseSelection.send(
                              prop.name
                              )}"
                    
                >Tag
                </IconButton>
            </td>
            <td>{prop.label}</td>
            <td>
                {#if tags && tags[prop.name]}
                    <TagEditor
                        label="{prop.label}"
                        name="{prop.name}"
                        {tags} {parsed}
                    />                
                {/if}
                </td>
        </tr>
    {/each}
</table>

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
