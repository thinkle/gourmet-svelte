<script>
 export let ingredients;
 export let maxWidth=250;
 export let editable = true;
 export let editMode = false;
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import {float_to_frac} from '../../utils/Numbers.js';
 import {onMount} from 'svelte';
 let uwidth=5;
 let iwidth=5;
 let awidth=5;
 export function setEditMode (v) {
     editMode = v;
 }
 const padding = 3;

 const adjustIngredientWidths =     ()=>{

     function crawlIng (i) {
	 if (i.iwidth > iwidth) {
	     iwidth = i.iwidth
	 }
	 if (i.awidth > awidth) {
	     awidth = i.awidth;
	 }
	 if (i.uwidth > uwidth) {
	     uwidth = i.uwidth;
	 }
         if (i.ingredients) {
             i.ingredients.forEach(crawlIng)
         }
     }
     
     ingredients.forEach(crawlIng)

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
 onMount(adjustIngredientWidths)
 
 $: if (ingredients) {
     adjustIngredientWidths()
 }
 
</script>

<div style="max-width:{maxWidth}px;">
    <ul class:edit-mode={editMode} class="inglist" style="--uwidth:{uwidth}px;--awidth:{awidth}px;--iwidth:{iwidth}px;--padding:{padding}px">
	{#each ingredients as i,n}
	    <li class:ing={!i.ingredients} class:grouphead={i.ingredients}>
                {#if i.ingredients}
                    {#if editMode}
                        <input bind:value={i.text} placeholder="Ingredient Group">
                        {#if (i.ingredients.length==0)}
                            <button on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients }}">
                                <i class="material-icons" >delete</i>
                            </button>
                        {/if}
                    {:else}
                        <h3>{i.text}</h3>
                    {/if}
                    <ul class="inglist">
                    {#each i.ingredients as ii,nn}
	                <li class='ing'>
                            {#if editMode}
                                <NumberUnitInput label={false} bind:value={ii.amount}/>
                                <input bind:value={ii.text} placeholder="Ingredient">
                                <button on:click="{()=>{i.ingredients.splice(nn,1);ingredients=ingredients }}"><i class="material-icons" >delete</i>
                                </button>
                            {:else}
	                        <span bind:clientWidth={ii.awidth} class='amount'>{ii.amount.amount&&float_to_frac(ii.amount.amount)||''}</span>
	                        <span bind:clientWidth={ii.uwidth} class='unit'>{ii.amount.unit||''}</span>
	                        <span bind:clientWidth={ii.iwidth} class='item'>{ii.text}</span>
                            {/if}
                        </li>
                    {/each}
                    {#if editMode}
                        <button
                            on:click="{()=>{i.ingredients.push({item:'',amount:{}});ingredients=ingredients}}"
                            type="icon"><i class='material-icons'>add</button>
                    {/if}
                    </ul>
                {:else}
                    {#if editMode}
                        <NumberUnitInput label={false} bind:value={i.amount}/>
                        <input placeholder="Ingredient" bind:value={i.item}>
                        <button on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients }}"><i class="material-icons" >delete</i>
                        </button>
                    {:else}
	                <span bind:clientWidth={i.awidth} class='amount'>{i.amount.amount&&float_to_frac(i.amount.amount)||''}</span>
	                <span bind:clientWidth={i.uwidth} class='unit'>{i.amount.unit||''}</span>
	                <span bind:clientWidth={i.iwidth} class='item'>{i.text}</span>
                    {/if}
                {/if}
	    </li>
	{/each}
        {#if editMode}
            <button
                on:click="{()=>{ingredients.push({item:'',amount:{}});ingredients=ingredients}}"
                type="icon"><i class='material-icons'>add</button>
                <button
                    on:click="{()=>{ingredients.push({item:'',ingredients:[
                              ]});ingredients=ingredients}}"
                    type="icon"><i class='material-icons'>collections</button>

                
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
 .grouphead {
     font-weight: bold;
 }
 .grouphead .ing {
     font-weight: normal;
 }

 .grouphead > input {
     font-weight: bold;
 }
</style>
