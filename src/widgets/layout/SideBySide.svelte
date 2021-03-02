<script>

 export let stackSidesAt = 700;
 export let maxWidth = 1200;
 export let leftWidth=300
 export let maxWidthLeft = undefined;
 export let maxWidthRight = undefined;

 import FullHeight from './FullHeight.svelte';
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import {onMount} from 'svelte';
 import {Resizer} from '../';
 let stackMode = false;
 let ref

 let initialLeftWidth
 import {watchResize} from 'svelte-watch-resize';

 onMount(
     ()=>{
 });


 function handleResize () {
     if (ref.clientWidth < Number(stackSidesAt)) {
         stackMode = true;
     }
     else {
         stackMode = false;
     }
 }


</script>

<FullHeight>
    <div use:watchResize={handleResize} bind:this={ref} class="sidebyside"
         style="{`
                width: ${stackSidesAt+2}; 
                --max-width:${maxWidth};
                --max-left:${maxWidthLeft};
                --max-right:${maxWidthRight};
                `}"
         class:stackMode
    >
        <div class="side l" style="{!stackMode && `width:${leftWidth}px`}">
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
</FullHeight>

<style>
 .head > :global(*) {
     border-bottom: 1px solid var(--grey);
     margin: 0;
     padding-bottom: 3px;
 }
 .side {
     display: flex;
     flex-direction: column;
     padding: var(--panel-pad, 11px);
 }
 .side .scrollBox {
     flex-grow: 1;
 }
 .sidebyside {
     display: flex;
     width: min(var(--max-width),100vw);
     margin: auto;
     max-height: 100%;
     flex-grow: 1;
 }
 .sidebyside.stackMode {
     display: block;
     overflow-y: scroll;
 }
 .scrollBox {
     overflow-y: scroll;      
 }

 .scrollBox::-webkit-scrollbar-track {
  padding: 2px 0;
  background-color: var(--light-bg);
}

.scrollBox::-webkit-scrollbar {
  width: 5px;
}
.stackMode .scrollBox::-webkit-scrollbar {
    width: 0px;
}
.scrollBox::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: var(--accent-bg);
}

 .l {
     max-width: var(--max-left);
     padding-left: var(--side-pad);
 }
 .r {
     max-width: var(--max-right);
     flex-grow: 1;
     padding-right: var(--side-pad);
 }
 .stackMode .l,.stackMode .r {
     height: auto;
     margin: auto;
 }
 
</style>
.
