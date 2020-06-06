<script>
 import { createEventDispatcher, setContext, getContext } from 'svelte';
 import RangeInput from './RangeInput.svelte';
 import SmallLabel from './SmallLabel.svelte';
 import {formatAmount,floatToFrac} from '../utils/numbers.js';
 export let mode='inline'
 const dispatch = createEventDispatcher();
 // name and url
 export let value
 export let multipliable=true
 let amountValue;
 $: if (value) {
     amountValue = {
         amount:value.amount,
         rangeAmount:value.rangeAmount
     }
 }
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
     delete value.rangeAmount // don't put it back...
     value = {...value,
              ...e.detail}
     change();
 }

</script>
<div>
    <SmallLabel on:click={()=>nref.focus()}>Number:</SmallLabel> 
    <RangeInput bind:this={nref} on:change={onNumberChange} class="url" type="number" bind:value={amountValue}/>
    <i>
        {#if multipliable && $multiplier!=1}
            (&times;{floatToFrac($multiplier)}={formatAmount(value,{multiplier:$multiplier})})
        {/if}
    </i>
</div>
<div>
    <SmallLabel on:click={()=>uref.focus()}>Unit:</SmallLabel> 
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
