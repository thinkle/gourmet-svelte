<script>
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 // name and url
 export let value
 let nref
 let uref
 export function focus () {
     nref.focus()
 }
 
 function change () {
     dispatch('change',value);
 }
 
</script>
<span> <!-- -  style="--awidth:{awidth}px;--uwidth:{uwidth}px"> -->
    <label on:click={()=>nref.focus()}>Number:</label> 
    <label on:click={()=>uref.focus()}>Unit:</label> 
    <input bind:this={nref} on:change={change} class="url" type="number" bind:value={value.amount}>
    <input bind:this={uref} on:change={change} class="name" type="text" bind:value={value.unit}>
</span>
<style>
 span {
     display: inline-grid;
     grid-template-columns: 6em auto;
     grid-template-columns: calc(3em + var(--awidth)) calc(2em + var(--uwidth));
     grid-column-gap: 4px;
 }
 .url {
     font-family: monospace;
 }
</style>
