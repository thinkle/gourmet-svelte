<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 import {onMount} from 'svelte';
 import Resizer from './Resizer.svelte';
 export let height;
 export let stackSidesAt = 700;
 export let maxWidth = 1200;
 let stackMode = false;
 let ref
 export let leftWidth=300
 let initialLeftWidth
 import {watchResize} from 'svelte-watch-resize';

 onMount(
     ()=>{
 });


 function handleResize () {
     console.log('SBS HANDLE RESIZE');
     if (ref.clientWidth < Number(stackSidesAt)) {
         stackMode = true;
     }
     else {
         stackMode = false;
     }
 }


</script>

<div use:watchResize={handleResize} bind:this={ref} class="top"
     style="{`--height:${height};
            --max-width:${maxWidth};
           `}"
     class:stackMode
>
    <div class="side l" style="{`width:${leftWidth}px`}">
	<div class="head scrollHead">
	    <slot name="leftHead">
	    </slot>
	</div>
	<div class="scrollBox">
	    <slot name="left"></slot>
	</div>
	
    </div>
    {#if !stackMode}
        <Resizer
            onStart="{({x,y})=>initialLeftWidth=leftWidth}"
            onDrag="{(dx)=>leftWidth=initialLeftWidth-dx}"
                    />
    {/if}
    <div class="side r">
	<div class="head scrollHead">
	    <slot name="rightHead">
	    </slot>
	</div>
	<div class="scrollBox">
	    <slot name="right"></slot>
	</div>
	
    </div>
</div>

<style>
 .head > :global(*) {
     font-size: 70%;	
     border-bottom: 5px solid var(--grey);
     margin: 0;
     padding-bottom: 3px;
 }
 .side {
     display: flex;
     flex-direction: column;
     padding: 11px;
 }
 .side .scrollBox {
     flex-grow: 1;
 }
 .top {
     display: flex;
     max-width: var(--max-width);
     width: 100%;
     margin: auto;
 }
 .top.stackMode {
     display: block;
     overflow-y: scroll;
 }
 .scrollBox {
     overflow-y: scroll; 
 }
 .l {
     height: var(--height);
 }
 .r {
     height: var(--height);
 }
 .stackMode .l,.stackMode .r {
     height: auto;
 }
 
</style>
.
