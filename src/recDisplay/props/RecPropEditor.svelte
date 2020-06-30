<script>
 export let value
 export let onChange
 export let prop;
 export function focus () {
     ref.focus();
 }


 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import RecDef from '../../common/RecDef.js';
 import RecBlock from '../text/RecBlock.svelte';
 import {PlainInput,
        DurationInput,
        UrlInput,
        ComboInput,
        CategoryInput,
        NumberUnitInput,
        ImageEntry,
        IconButton} from '../../widgets/';
import {lookupStores} from '../../stores/recipeStores.js';

 let modes = RecDef.EditModes

 const propInput = {
     [modes.TXT] : PlainInput,
     [modes.RCH] : RecBlock,
     [modes.DUR] : DurationInput,
     [modes.CMB] : ComboInput,
     [modes.MCMB] : CategoryInput,
     [modes.LNK] : UrlInput,
     [modes.NUMUNIT] : NumberUnitInput,
     [modes.IMG] : ImageEntry
 }


 function handleChange (event) {
     //value = event.detail || event.target.value;
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

 let optionStore = lookupStores[prop.name]

</script>
{#if prop.array && prop.edit!==modes.MCMB}
    <div   class="multiContainer">
        {#each value as subval,n}
            <IconButton bare="{true}" small="{true}" icon="remove"
                        on:click="{()=>{
                                  value.splice(n,1)
                                  value = value;
                                  }}"
            />
            <div>
                {#if n==0}
                    <!-- focus target -->
                    <svelte:component
                        bind:this="{ref}"
                        placeholder="Type {prop.label.toLowerCase()} here…"
                        this="{propInput[prop.edit]}"
                        on:change="{makeArrayHandler(n)}"
                        on:input="{makeArrayHandler(n)}"
                        bind:value="{value[n]}"/>
                {:else}
                    <svelte:component
                        placeholder="{`Type {prop.label.toLowerCase()} ${n+1} here…`}"
                        this="{propInput[prop.edit]}"
                        on:change="{makeArrayHandler(n)}"
                        on:input="{makeArrayHandler(n)}"
                        bind:value="{value[n]}"/>
                {/if}
            </div>
        {/each}
        <span></span> <!-- Placeholder in grid -->
        <IconButton
            bare="{true}"
            icon="add"
            small="{true}"
            on:click="{()=>value=[...value,{...prop.empty}]}"
        >Add {prop.label}</IconButton>
    </div>
{:else}
    <svelte:component
        placeholder="Type {prop.label.toLowerCase()} here…"
        this="{propInput[prop.edit]}"
        options="{[...prop.options||[], ...(optionStore && $optionStore||[])]}"
        on:change="{handleChange}"
        on:input="{handleChange}"
        bind:value="{value}"
        bind:this="{ref}"
    />
{/if}

<style>
 
 .multiContainer {
     display: grid;
     grid-template-columns: 2em auto;
     row-gap: 5px;
     width: 100%;
 }

 .multiContainer > button {
     align-self: center;
     justify-self: center;
 }

</style>
