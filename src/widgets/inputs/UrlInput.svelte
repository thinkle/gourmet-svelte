<script>
 /*  import { TextField } from "smelte"; */
 import FancyInput from './PlainInput.svelte';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
 // name and url
 export let value
 let uref;
 let tref;

 export function focus () {
     uref.focus();
 }

 function change () {
     dispatch('change',value);
 }
 
</script>
<div>
    <label on:click={()=>tref.focus()}>Text:</label>
    <FancyInput bind:this="{tref}" on:change={change} on:input="{change}" class="name" type="text" bind:value={value.name}/>
    <label on:click={()=>uref.focus()}>URL:</label>
    <FancyInput bind:this={uref} on:change={change} on:input="{change}" class="url" type="text" bind:value={value.url}/>
</div>
<style>
 div {
     display: inline-grid;
     grid-template-columns: 3em auto;
     grid-column-gap: 3px;
 }
 label {
     text-align: right;
 }
 .url {
     font-family: monospace;
     width : 100%;
 }
</style>
