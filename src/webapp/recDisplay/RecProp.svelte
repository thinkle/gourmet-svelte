<script>
 export let value
 export let prop
 export let editable
 export let forceEdit
 export let showLabel=true;
 import RecDef from '../../common/RecDef.js';
 import PlainInput from '../../widgets/PlainInput.svelte';
 import DurationInput from '../../widgets/DurationInput.svelte';
 import UrlInput from '../../widgets/UrlInput.svelte';
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte';
 let modes = RecDef.EditModes
 let ref;
 const propInput = {
     [modes.TXT] : PlainInput,
     [modes.RCH] : PlainInput,
     [modes.CMB] : PlainInput,
     [modes.DUR] : DurationInput,
     [modes.CMB] : PlainInput,
     [modes.LNK] : UrlInput,
     [modes.NUMUNIT] : NumberUnitInput,
 }
 console.log('propInput:',propInput);
 var displayValue;
 $: displayValue = value && prop.toHtml && prop.toHtml(value) || value || '?'

 var edit;
 var editOn = false;
 $: edit = editOn || forceEdit;

 $: {
     console.log('Edit',edit,'editOn',editOn,'force',forceEdit)
 }
 
 function turnEditOn () {
     console.log('Edit on - was ',editOn)
     editOn = true
 }
 function turnEditOff () {
     console.log('Edit OFf - was ',editOn)
     editOn = false;
 }

 function handleChange (event) {
     value = event.detail || event.target.value;
 } 
 
</script>
<div>
    <div>
        {#if showLabel}
        <div class="top" >
            <label on:click={()=>ref.focus()}>{prop.label}</label>
            {#if editable && !edit}
            <button class="icon" on:click={turnEditOn}>
                <i class="material-icons">edit</i>
            </button>
            {/if}
            {#if edit && !forceEdit}
            <button class="icon" on:click={turnEditOff}>
                <i class="material-icons">done</i>
            </button>
            {/if}
        </div>
        {/if}
        <div>
            {#if edit}
            <svelte:component this={propInput[prop.edit]}
                              on:change={handleChange}
                              displayValue={displayValue}
                              value={value}
                              bind:this={ref}
            />
            {:else}
            <b>{@html displayValue}</b>
            {/if}
            {#if !showLabel}
              {#if editable && !edit}
              <button class="icon" on:click={turnEditOn}>
                  <i class="material-icons">edit</i>
              </button>
              {/if}
              {#if edit && !forceEdit}
              <button class="icon" on:click={turnEditOff}>
                  <i class="material-icons">done</i>
              </button>
              {/if}
           {/if}
        </div>
    </div>

</div>
<style>
 div {
     display: block;
 }
 .top {
     display: flex;
     width: 100%;
     align-items: center;
 }
 .top button {
     margin-left: 1em;
 }

 b {
     margin-right: 0.5em;
 }
 input {
     margin-bottom: 0;
 }
 button {
     align-self: flex-end;
     margin-bottom: 0}
 input {
     color: var(--black);
     background-color: var(--white);}

</style>
