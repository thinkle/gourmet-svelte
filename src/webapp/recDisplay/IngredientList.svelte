<script>
 export let ingredients;
 export let maxWidth=175;

 import {onMount} from 'svelte';
 let uwidth=5;
 let iwidth=5;
 let awidth=5;
 const padding = 3;
 onMount(
     ()=>{
	 ingredients.forEach(
	     (i)=>{
		 if (i.iwidth > iwidth) {
		     iwidth = i.iwidth
		 }
		 if (i.awidth > awidth) {
		     awidth = i.awidth;
		 }
		 if (i.uwidth > uwidth) {
		     uwidth = i.uwidth;
		 }
	     }
	 ); // end forEach
	 while ( (uwidth + iwidth + awidth + padding*6) > maxWidth) {
	     if (iwidth >= uwidth && iwidth >= awidth) {
		 iwidth -= 1;
	     }	
	     else if (uwidth >= uwidth && uwidth >= awidth) {
		 uwidth -= 1;
	     }
	     else {
		 awidth -= 1;
	     }
	 } // end while...
     }
 ); // end onMount
 
 
</script>

<div style="max-width:{maxWidth}px;">
    <ul class="inglist" style="--uwidth:{uwidth}px;--awidth:{awidth}px;--iwidth:{iwidth}px;--padding:{padding}px">
	{#each ingredients as i}
	<li class='ing'>
	    <span bind:clientWidth={i.awidth} class='amount'>{i.amount}</span>
	    <span bind:clientWidth={i.uwidth} class='unit'>{i.unit}</span>
	    <span bind:clientWidth={i.iwidth} class='item'>{i.item}</span>
	</li>
	{/each}
    </ul>
    
</div>

<style>
 .inglist {
     padding: 0;
 }
 .ing {display: flex;}
 
 .ing span {
     padding: var(--padding); 
     display: inline-block;
 }
 .ing span {border-bottom: 1px solid grey;}
 .ing:last-child span {border-bottom: none;}
 .amount {
     min-width: var(--awidth);
 }
 .unit {
     min-width: var(--uwidth);
 }
 .item {
     min-width: var(--iwidth);
 }

</style>
