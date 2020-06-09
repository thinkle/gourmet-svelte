<script>
 
 import tagger from './tagger.js';
 import ipsum from '../../common/mocks/ipsum.js'
 import RecDef from '../../common/RecDef.js';
 import {onMount} from 'svelte'
 let response;
 onMount(
     ()=>{
         response = tagger.tagElement(ref,'text')
     }
 );

 let ref;
</script>
<div>

    <h2>Some content because content is rarely at the top of the page</h2>
    <div><p bind:this={ref}>Initial Tag to Play with</p></div>
    <h3>
        Tag selection
    </h3>
    {#each RecDef.importProps as prop}
        <button
            on:click={()=>response=tagger.markupAndGetSelection(prop.name)}>
            {prop.label}
        </button>
        {#if prop.hasDetail}
            <button
                on:click={()=>response=tagger.markupAndGetSelection(prop.name,'foo boo')}>
                {prop.label} (w/ text)
            </button>
        {/if}
    {/each}
    {@html ipsum.generateParagraphs(5)}
    <p>{JSON.stringify(response)}</p>
</div>
