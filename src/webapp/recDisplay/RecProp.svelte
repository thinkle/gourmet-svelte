<script>
 import {getContext} from 'svelte'
 export let value
 export let prop
 export let editable=false;
 export let forceEdit=false;
 export let showLabel=true;
 import RecDef from '../../common/RecDef.js';
 import PlainInput from '../../widgets/PlainInput.svelte';
 import DurationInput from '../../widgets/DurationInput.svelte';
 import UrlInput from '../../widgets/UrlInput.svelte';
 import ComboInput from '../../widgets/ComboInput.svelte';
 import CategoryInput from '../../widgets/CategoryInput.svelte';
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte';
 import NumberUnitDisplay from '../../widgets/NumberUnitDisplay.svelte';
 let modes = RecDef.EditModes
 let recipeChanges = getContext('recipeChanges');
 let ref;
 const propInput = {
     [modes.TXT] : PlainInput,
     [modes.RCH] : PlainInput,
     [modes.DUR] : DurationInput,
     [modes.CMB] : ComboInput,
     [modes.MCMB] : CategoryInput,
     [modes.LNK] : UrlInput,
     [modes.NUMUNIT] : NumberUnitInput,
 }

 const propDisplay = {
     [modes.NUMUNIT] : NumberUnitDisplay,
 }

 var displayValue;
 function getDisplayVal (v) {
     return v && prop.toHtml && prop.toHtml(v) || v
 }
 
 $: if (prop.array) {
     if (!value) {
         value = []
     }
 }

 /* $: {
  *     if (prop.array) {
  *         displayValue = value && prop.array && value.map(getDisplayVal) || []
  *     }
  *     else {
  *         displayValue = getDisplayVal(value,$multiplier);
  *     }
  * } */


 var edit;
 var editOn = false;
 $: edit = editOn || forceEdit;

 
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
     $recipeChanges += 1;
 }

 function makeArrayHandler (n) {
     return function (event) {
         value[n] = event.detail || event.target.value;
         value = value;
         $recipeChanges += 1;
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
                            <div>
                                <svelte:component this="{propInput[prop.edit]}"
                                                  on:change="{makeArrayHandler(n)}"
                                                  value="{value[n]}"/>
                            </div>
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
                             value={value}
                        bind:this={ref}
                    />
                {/if}
            {:else}
                {#if prop.array}
                    {#each value as v,n}
                        <span class="arrayval">
                            {#if propDisplay[prop.edit]}
                                <svelte:component
                                    this="{propDisplay[prop.edit]}"
                                    value="{v}"
                                />
                            {:else}
                                <!-- generic display -->
                                {@html getDisplayVal(v)}
                            {/if}
                        </span>
                    {/each}
                {:else}
                        {#if propDisplay[prop.edit]}
                            <svelte:component
                                this="{propDisplay[prop.edit]}"
                                value="{value}"
                            />
                        {:else}
                            <!-- generic display -->
                            {@html getDisplayVal(value)}
                        {/if}
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

 .arrayval {
     display: inline-block;
     padding-right: 1em;
 }

</style>
