<script>
 // properties you will want to pass through tooltip.js
 export let content=''
 export let width=120;
 export let pad=5;
 export let arrow=4;
 export let vertical='bottom'
 export let horizontal='center'

 // Properties set by tooltip.js as it works
 export let show=false
 export let x=0;
 export let y=0;
 let topMode, rightMode, leftMode
 $: topMode = (vertical=='top');;
 $: rightMode = (horizontal=='right');
 $: leftMode = (horizontal=='left');
 import {fade} from 'svelte/transition'

</script>
{#if show}
    <section
	style="{`position:fixed;top:${y}px;left:${x}px;--width:${width}px;--pad:${pad}px;--arrow:${arrow}px`}"
    >
        <div in:fade out:fade="{{delay:300,duration:300}}"
	     class:top={topMode}
	     class:bottom={!topMode}
	     class:right={rightMode}
	     class:left={leftMode}
	     class:center={!leftMode&&!rightMode}
	>
            <slot/>{content}
        </div>
    </section>
{/if}
<style>
 div {  
     pointer-events: none;
     background-color: #555;
     color: #fff;
     text-align: center;
     border-radius: 6px;
     padding: 5px;
     position: absolute;
     z-index: 1;
     font-size: small;
     width:var(--width);
     }
 .top {
     bottom: var(--pad);
 }
 .bottom {
     top : var(--pad);
 }
 .left {
     right : var(--pad);
 }
 .right {
     left : var(--pad);
 }
 .center {
     left : calc(var(--width)/-2);
     text-align: center;
 }
 /* arrows */
 div::before {
     content:'';
     position: absolute;
     width: 0px;
     height: 0px;
 }
 .top::before {
     bottom:calc(var(--arrow)*-2);
     left: calc(var(--width)/2 - var(--arrow));
     border-color: #555 transparent transparent transparent;
     border-width: var(--arrow);
     border-style: solid;
 }
 .bottom::before {
     top:calc(var(--arrow)*-2);
     left: calc(var(--width)/2 - var(--arrow));
     border-color: transparent transparent #555 transparent;
     border-width: var(--arrow);
     border-style: solid;
 }
 
 
</style>
<svelte:options accessors/>
