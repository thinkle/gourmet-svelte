<script>
 import Metadata from '../../common/RecDef.js';
 import Combo from '../../widgets/ComboInput.svelte';
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
                 console.log("Losing focus: ",editor.ownerDocument.activeElement,"not in ",editor);
                 active = false
             }
             else {
                 console.log("Keeping focus!",editor.ownerDocument.activeElement);
             }
         },
         100);
 }

 $: { if (!active) {
     wasActive = false
  }}
              
              // Ugliness to get around iFrame limitations (can't get proper svelte styles into the iFrame, alas)
              const styles = `
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
              `

</script>
<!-- THIS ELEMENT IS BROUGHT INTO AN IFRAME SO ALL STYLES MUST BE INLINED-->
{@html styles}
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
            <button on:blur={maybeInactivate} style="border:none;" on:click={removeTag}>Remove</button>
            <!-- <button style="border:none;" on:click={()=>active=false}>&times;</button> -->
            {#if name && Metadata.importPropsByName[name] && Metadata.importPropsByName[name].hasDetail}
                <input on:blur={maybeInactivate} bind:value={detail}>
            {:else}
                <span>&nbsp;</span>
            {/if}
            <button on:click={()=>active=false}>(close)</button>

        </div>
    {:else}
        <span
            on:click={()=>active=true}
                     class='label'
        >{name} {#if detail && Metadata.importPropsByName[name] && Metadata.importPropsByName[name].hasDetail}: {detail}{/if}</span>
    {/if}
</div>

<style>
</style>
