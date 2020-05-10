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
 import ComboInput from '../../widgets/ComboInput.svelte';
 import CategoryInput from '../../widgets/CategoryInput.svelte';
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte';
 let modes = RecDef.EditModes
 let ref;
 const propInput = {
     [modes.TXT] : PlainInput,
     [modes.RCH] : PlainInput,
     [modes.CMB] : PlainInput,
     [modes.DUR] : DurationInput,
     [modes.CMB] : ComboInput,
     [modes.MCMB] : CategoryInput,
     [modes.LNK] : UrlInput,
     [modes.NUMUNIT] : NumberUnitInput,
 }
 $: console.log('Value=',value);
 var displayValue;
 function getDisplayVal (v) {
     return v && prop.toHtml && prop.toHtml(v) || v
 }
 $: displayValue = prop.array && value.map(getDisplayVal) || getDisplayVal(value);

 $: console.log('Display val=',displayValue);

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

 function makeArrayHandler (n) {
     return function (event) {
         value[n] = event.detail || event.target.value;
         value = value;
     }
 }
 
</script>
<div>
    <div>
        {#if showLabel}
            <div class="top" >
                <label on:click={()=>ref.focus()}>{prop.label}</label>
                {#if editable && !edit}
                    <button class="edit icon" on:click={turnEditOn}>
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
                {#if prop.array}
                    <div class="multiContainer">
                        {#each value as subval,n}
                            <button class="icon"
                                    on:click={()=>{
                                        value.splice(n,1)
                                        value = value;
                                    }}
                            >
                                <i class="material-icons">remove
                                </i>
                            </button>
                            <svelte:component this="{propInput[prop.edit]}"
                                              on:change="{makeArrayHandler(n)}"
                                              displayValue="{displayValue[n]}"
                                              value="{value[n]}"/>
                        {/each}
                        <button class="icon"
                                on:click={()=>value=[...value,...prop.empty]}
                        ><i class="material-icons">add</i></button>
                    </div>
                {:else}
                    <svelte:component
                        this={propInput[prop.edit]}
                             options={prop.options}
                        on:change={handleChange}
                             displayValue={displayValue}
                        value={value}
                             bind:this={ref}
                    />
                {/if}
            {:else}
                {#if prop.array}
                    {#each displayValue as v}
                    <b>
                        {@html v}
                    </b>
                    {/each}
                {:else}
                <b>
                    {@html displayValue}
                </b>
                {/if}
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
 button.edit {
     align-self: flex-end;
     margin-bottom: 0}
 input {
     color: var(--black);
     background-color: var(--white);}

 .multiContainer {
     display: grid;
     grid-template-columns: 4em auto;
     row-gap: 20px;
 }

 .multiContainer > button {
     align-self: center;
     justify-self: center;
 }


</style>
