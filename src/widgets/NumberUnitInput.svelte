<script>
 import { createEventDispatcher, setContext, getContext } from 'svelte';
 import AmountInput from './AmountInput.svelte';
 import {float_to_frac} from '../utils/Numbers.js';
 export let mode='inline'
 const dispatch = createEventDispatcher();
 // name and url
 export let value
 export let multipliable=true
 
 let nref
 let uref
 export function focus () {
     nref.focus()
 }
 
 function changeMultiplier () {
     dispatch('multiply',value);
 }

 function change () {
     dispatch('change',value);
 }
 
 let multiplier = getContext('multiplier');

 function onNumberChange (e) {
     console.log('Number changed',e);
     value.amount = e.detail;
     change();
 }

</script>
<div>
    <label on:click={()=>nref.focus()}>Number:</label> 
    <AmountInput bind:this={nref} on:change={onNumberChange} class="url" type="number" bind:value={value.amount}/>
    <i>
        {#if multipliable && $multiplier!=1}
            (&times;{float_to_frac($multiplier)}={float_to_frac(value.amount*$multiplier)})
        {/if}
    </i>
</div>
<div>
    <label on:click={()=>uref.focus()}>Unit:</label> 
    <input bind:this={uref} on:change={change} class="name" type="text" bind:value={value.unit}>
</div>

<style>
 i {
     font-size: 0.7rem;
     display: block;
     text-align: center;
 }
 div {
     display: table-cell;
 }
 input {
     width: 5em;
 }

</style>
