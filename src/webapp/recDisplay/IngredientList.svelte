<script>
 export let ingredients;
 export let maxWidth=250;
 export let editable = true;
 export let editMode = false;
 import NumberUnitImport from '../../widgets/NumberUnitInput.svelte'
 import {float_to_frac} from '../../utils/Numbers.js';
 import {onMount} from 'svelte';
 let uwidth=5;
 let iwidth=5;
 let awidth=5;
 export function setEditMode (v) {
    editMode = v;
 }
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
    <ul class:edit-mode={editMode} class="inglist" style="--uwidth:{uwidth}px;--awidth:{awidth}px;--iwidth:{iwidth}px;--padding:{padding}px">
	{#each ingredients as i,n}
	<li class='ing'>
            {#if editMode}
            
             <NumberUnitImport label={false} bind:value={i}/>
             <input bind:value={i.item}>
             <button on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients }}"><i class="material-icons" >delete</i>
             </button>
        {:else}
	    <span bind:clientWidth={i.awidth} class='amount'>{i.amount&&float_to_frac(i.amount)||''}</span>
	    <span bind:clientWidth={i.uwidth} class='unit'>{i.unit||''}</span>
	    <span bind:clientWidth={i.iwidth} class='item'>{i.item}</span>
        {/if}
	</li>
	{/each}
        {#if editMode}
        <button
            on:click="{()=>{ingredients.push({item:''});ingredients=ingredients}}"
            type="icon"><i class='material-icons'>add</button>
            {/if}
    </ul>
    
</div>

<style>
.edit-mode {
  font-size : 0.8em
}
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
