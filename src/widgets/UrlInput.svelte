<script>
 /*  import { TextField } from "smelte"; */
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
    <label on:click={()=>uref.focus()}>URL:</label>
    <input bind:this={uref} on:change={change} class="url" type="text" bind:value={value.url}>
    <label on:click={()=>tref.focus()}>Text:</label>
    <input bind:this="{tref}" on:change={change} class="name" type="text" bind:value={value.name}>
</div>
<style>
 div {
     display: inline-grid;
     grid-template-columns: 6em auto;
     grid-column-gap: 3px;
     width: 100%;
 }
 label {
     text-align: right;
 }
 .url {
     font-family: monospace;
     width : 100%;
 }
</style>
