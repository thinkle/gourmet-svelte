<script>
 import RecDef from '../../common/RecDef.js';
 import RecBlock from './RecBlock.svelte';
 import PlainInput from '../../widgets/PlainInput.svelte';
 import DurationInput from '../../widgets/DurationInput.svelte';
 import UrlInput from '../../widgets/UrlInput.svelte';
 import ComboInput from '../../widgets/ComboInput.svelte';
 import CategoryInput from '../../widgets/CategoryInput.svelte';
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 export let value
 export let onChange
 export let prop;
 export function focus () {
     ref.focus();
 }

 let modes = RecDef.EditModes

 const propInput = {
     [modes.TXT] : PlainInput,
     [modes.RCH] : RecBlock,
     [modes.DUR] : DurationInput,
     [modes.CMB] : ComboInput,
     [modes.MCMB] : CategoryInput,
     [modes.LNK] : UrlInput,
     [modes.NUMUNIT] : NumberUnitInput,
 }


 function handleChange (event) {
     value = event.detail || event.target.value;
     onChange && onChange(value)
 }

 function makeArrayHandler (n) {
     return function (event) {
         value[n] = event.detail || event.target.value;
         value = value;
         onChange && onChange(value)
     }
 }

 let ref;

</script>
{#if prop.array}
    <div   class="multiContainer">
        {#each value as subval,n}
            <IconButton bare="true" icon="remove"
                        on:click={()=>{
                                 value.splice(n,1)
                                 value = value;
                                 }}
            />
            <div>
                {#if n==0}
                    <!-- focus target -->
                    <svelte:component
                        bind:this={ref}
                                  this="{propInput[prop.edit]}"
                        on:change="{makeArrayHandler(n)}"
                        bind:value="{value[n]}"/>
                {:else}
                    <svelte:component
                        this="{propInput[prop.edit]}"
                        on:change="{makeArrayHandler(n)}"
                        bind:value="{value[n]}"/>
                {/if}
            </div>
        {/each}
        <IconButton bare="true" icon="add" class="icon"
                    on:click={()=>value=[...value,...prop.empty]}
        />
    </div>
{:else}
    <svelte:component
        this={propInput[prop.edit]}
        options={prop.options}
        on:change={handleChange}
        bind:value={value}
        bind:this={ref}
    />
{/if}
