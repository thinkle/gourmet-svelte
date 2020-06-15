<script>
 // An element that comes up on the screen when commanded. Possibly appearing to animate from another element...
 export let delay=3000
 import {IconButton} from '../'
 import {onDestroy} from 'svelte';
 import {fade} from 'svelte/transition'
 let timeout
 export function popUp () {
     if (timeout) {
         clearTimeout(timeout);
     }
     show = true;
     timeout = setTimeout(
         ()=>{show=false},
         delay
     )
 }

export function close () {
     show = false;
     if (timeout) {clearTimeout(timeout)}
 }
 
 onDestroy(()=>{
     if (timeout) {clearTimeout(timeout)}
 });

 function delayClose () {
     clearTimeout(timeout);
     
 }

 let show
</script>
{#if show}
<section>
    <div class="toaster"
         transition:fade="{{duration:500}}"
         on:mouseenter="{delayClose}"
         on:mouseleave="{popUp}"> <!-- Starts the timer again... -->
        <slot/>
        <div class="close">
            <IconButton on:click="{close}" bare="{true}" small="{true}" icon="close"/>
        </div>
    </div>
</section>
{/if}
<style>
 section {
     position: fixed;
     bottom: 0;
     width: 100%;
     display: flex;
     align-content: center;
     justify-content: center;
     padding-bottom: 5px;
     z-index: 99;
 }
 .toaster {
     margin: auto;
     background-color: var(--note-bg);
     color: var(--note-fg);
     position: relative;
     padding: var(--small);
     border-radius: 5px 5px 0px 0px;
     border-color: rgba(128,128,128,0.5);
     border-style: solid;
     border-width: 5px 5px 0 5px;
 }
 .close {
     position: absolute;
     top: 0;
     right: 0;
 }
 
</style>
