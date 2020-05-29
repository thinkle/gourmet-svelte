<script>
 import {onMount} from 'svelte';
 export let height;
 export let growRight = false;
 export let growLeft  = false;
 export let growEven = false;
 export let leftBasis = '';
 export let rightBasis = '';
 export let stackSidesAt = 500;
 export let fillHeight = true;
 let stackMode = false;
 let ref
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
     style={`--height:${height};--leftBasis:${leftBasis};--rightBasis:${rightBasis}`}
     class:growRight
     class:growLeft
     class:growEven
     class:stackMode
>
    <div class="side l">
	<div class="head scrollHead">
	    <slot name="leftHead">
	    </slot>
	</div>
	<div class="scrollBox">
	    <slot name="left"></slot>
	</div>
	
    </div>
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
 .growEven .l,.growLeft .l {
     flex-grow: 1
 }
 .growEven .r, .growRight .r {
     flex-grow: 1;
 }
 .growLeft .r {
     flex-shrink : 2;
 }
 .growRight .l {
     flex-shrink: 2;
 }
 .l {
     flex-basis: var(--leftBasis);
 }
 .r {
     flex-basis: var(--rightBasis);
 }
 .top {
     display: flex;
     background-color: 100px;
 }
 .top.stackMode {
     display: block;
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
