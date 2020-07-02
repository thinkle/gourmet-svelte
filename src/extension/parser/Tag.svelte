<script>
 import Metadata from '../../common/RecDef.js';
 import {IconButton} from '../../widgets/';
 export let name;
 export let detail;
 let hidden = false;
 export let onRemove;

 let wasActive = false;
 let active = false;

 function removeTag () {
     hidden = true;
     if (onRemove) {
         onRemove()
     }
 }
 let select;
 let editor;
 $:  if (active && !wasActive && select) {
     select.focus()
     wasActive = true;
 }

 function maybeInactivate () {
     setTimeout(
         ()=>{
             if (!editor.contains(editor.ownerDocument.activeElement)) {
                 active = false
             }
         },
         100);
 }

 $: { if (!active) {
     wasActive = false
  }}
              

</script>
<div class="wrap" class:active class:hidden>
    {#if active}
        <div bind:this={editor} class="grid">
            <select
                bind:this={select}
                          bind:value={name}            
            >
                {#each Metadata.importProps as prop}
                    <option on:blur={maybeInactivate} value={prop.name}>
                        {prop.label}
                        {#if prop.name==name && prop.hasDetail && detail}
                            : {detail}
                        {/if}
                    </option>
                {/each}
            </select>
            <span>
                <!-- <IconButton bare={true} icon="delete" on:blur={maybeInactivate} style="border:none;" on:click={removeTag}/> -->
                <IconButton bare={true} icon="close" on:click={()=>active=false}/>
            </span>
            <!-- <button style="border:none;" on:click={()=>active=false}>&times;</button> -->
            {#if name && Metadata.importPropsByName[name] && Metadata.importPropsByName[name].hasDetail}
                <input on:blur={maybeInactivate} bind:value={detail}>
            {:else}
                <span>&nbsp;</span>
            {/if}
            

        </div>
    {:else}
        <span
            on:click={()=>active=true}
                     class='label'
        >{name} {#if detail && Metadata.importPropsByName[name] && Metadata.importPropsByName[name].hasDetail}: {detail}{/if}

            <IconButton bare={true} small={true} icon="delete" on:click={removeTag}/>
        </span>
    {/if}
</div>

<style>
 .label:hover { 
              background-color: yellow;
              font-weight:bold;
              }
 .label {
     padding: 0.5em;
 }


 .hidden {
     visibility: hidden;
 }

 .wrap  {
     display: inline-block;
     border-radius: 5px;
     border: 1px solid brown;
 }
 .wrap:focus-within {
     border-width: 2px;
     min-height: 18px;
 }


 .wrap select {
     background-color: transparent;
 }

 .wrap button {
     background-color: #eee;
     color: #222;
     border-radius: 12px;
     transition: all 100ms;
 }
 .wrap button:hover {
     background-color: #222;
     color: white;
 }

 .wrap  {
     padding: 2px;
     background-color: white;
     color: black;
     font-size: 10px;
     font-family:sans-serif;
     font-weight: bold;
     text-align: right;
 }
 .grid {
     display: inline-grid;
     grid-template-columns: auto auto;
 }
 
</style>
