<script>
 export let active=false;
 export let fancy=true;

 let vanilla,flying;
 $: {if (fancy) {
     vanilla = false;
     flying = true;
 } else {
     vanilla = true;
     flying = false;
 }}
 
 let width
 import {tick} from 'svelte';
 import {getCrossfade} from './tabCrossfade.js';
 var send = ()=>{}
 var receive = ()=>{}
 let el,parent
 $: parent = el && el.parentNode
 $: if (parent) {[send,receive]=getCrossfade(parent.getAttribute('tabIdentifier'));}

 /* Begin ugliness */
 /* The code below shouldn't be necessary, but sometimes svelte reads the clientWidth when it's 0 and then never reads it again... */
 const maxTries = 3; /* Just in case we enter an infinite loop */
 let tries = 0;
 $: {
     if (width==0) {
         if (tries < maxTries) {
             setTimeout(
                 ()=>{
                     width = el.clientWidth;
                 },
                 10
             );
         } else {
             console.log('Weird: looks like we are in some kind of infinite loop? Escaping rather than crash the app');
             debugger;
         }
         tries += 1
     }
 }
 /* End ugly code */
</script>

<li bind:this="{el}" bind:clientWidth="{width}" class:active on:click tabindex="0" class:vanilla>
    <slot/>
    <!-- Underline container -->
    <u style="{`width:${width}px`}">
        {#if vanilla}<span class:vanilla></span>{/if}
        {#if active && fancy}
            <span
                class:flying
                in:receive
                out:send
            ></span>
        {/if}
    </u>
</li>

<style>

 u {
     position: absolute;
     display: flex;
     bottom: -3px;
     left: 0;
     height: 3px;
     z-index: 2;
 }
 li:hover u.vanilla {
     background-color: var(--light-underline);
 }
 u span.flying {
     width: 100%;
     background-color: var(--accent-bg);
 }
 u span.vanilla {
     width: 0%;
     background-color: transparent;
     transition: all 600ms;
     margin-left: auto;
     margin-right: auto;
 }
 .active u span.vanilla {
     width: 100%;
     background-color: var(--accent-bg);
 }
 
 li {
     list-decoration: none;
     box-sizing: border-box;
     padding: 0.5em;
     margin-right: 3px;
     margin-bottom: 3px;
     font-weight: 300;
     transition: all 300ms;
     display: flex;
     position: relative;
     border-bottom: 1px solid var(--light-underline);
     /* max-width: 15em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap; */
 }

 li.active {
     font-weight: 500;
     border-color: transparent;
 }

 
 li:hover {
     /* border-bottom: 3px solid var(--medium-underline); */
     background-color: var(--light-bg);
     color: var(--light-fg);
     font-weight: 500;
     background: var(--light-bg) radial-gradient(circle, transparent 1%, var(--light-bg) 1%) center/15000%;
 }

 li:active {
     background-color: var(--medium-bg);
     color: var(--medium-fg);
     background-size: 100%;
     transition: background 0s;
 }

 li.active:hover {
     border-color: transparent;
 }
</style>
