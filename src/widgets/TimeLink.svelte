<script>
 import Timer from './Timer.svelte'
 import times from '../utils/times.js';
 export let seconds=60
 export let label=""
 export let timestring=""
 import { fly } from 'svelte/transition';
 export let value;

 $: if (value) {
     seconds = value.seconds
     label = value.name
     timestring = value.text
 }
 
 let show = false;
</script>
<div>
    <label>{label}{#if label}:{/if}
        <span href="#showTimer" on:click={()=>show=!show}>
            {timestring||times.getDescription(seconds)}
        </span>
    </label>
    {#if show}
        <div transition:fly>
            <Timer duration={seconds}/>
        </div>
    {/if}
</div>

<style>
 span:hover {
     text-decoration: underline;
 }
</style>
