<script>
 import {getContext} from 'svelte';
 export let recursive=false;
 export let ingredients;
 export let maxWidth=250;
 export let editable = true;
 export let editMode = false;
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import NumberUnitDisplay from '../../widgets/NumberUnitDisplay.svelte'
 import FancyInput from '../../widgets/PlainInput.svelte';
 import {float_to_frac} from '../../utils/Numbers.js';
 import {onMount} from 'svelte';
 let recipeChanges = getContext('recipeChanges');

 function onChange () {
     $recipeChanges += 1
 }

 export function getWidth () {
     if (!recursive) {
         throw 'WTF?'
     }
     else {
         return ref.clientWidth
     }
 }
 export function setEditMode (v) {
     editMode = v;
 }
 const padding = 3;

 
 function adjustWidths () {
     if (invisibleCopy) {
         idealWidth = invisibleCopy.getWidth()
     }
 }

 $: if (invisibleCopy && ingredients && !recursive) {
     adjustWidths()
 }
 
 let ref
 let invisibleCopy
 let idealWidth = 100

 function getStyle () {
     if (!recursive) {
         return `--idealWidth:${idealWidth}px;`
     }
 }

</script>

<div style="max-width:{maxWidth}px;">
    <ul bind:this={ref}  class:edit-mode={editMode} class="inglist" style={getStyle(idealWidth)}>
	{#each ingredients as i,n}
	    <li class:ing={!i.ingredients} class:grouphead={i.ingredients}>
                {#if i.ingredients}
                    {#if editMode}
                        <FancyInput on:change={onChange} bind:value={i.text} placeholder="Ingredient Group"/>
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
                                    <NumberUnitInput on:change={onChange} mode="table" label={false} bind:value={ii.amount}/>
                                    <td>
                                        <label>Item:</label> 
                                        <FancyInput on:change={onChange} bind:value={ii.text} placeholder="Ingredient"/>
                                    </td>
                                    <button on:click="{()=>{i.ingredients.splice(nn,1);ingredients=ingredients }}"><i class="material-icons" >delete</i>
                                    </button>
                                {:else}
                                    <NumberUnitDisplay  mode="table" value={ii.amount}/>
                                    
	                            <!-- <span bind:clientWidth={ii.awidth} class='amount'>{ii.amount.amount&&float_to_frac(ii.amount.amount)||''}</span>
	                                 <span bind:clientWidth={ii.uwidth} class='unit'>{ii.amount.unit||''}</span> -->

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
                        <NumberUnitInput on:change={onChange} mode="table" label={false} bind:value={i.amount}/>
                        <td>
                            <label>Item:</label> 
                            <FancyInput on:change={onChange} placeholder="Ingredient" bind:value={i.text}/>
                        </td>
                        <button on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients }}"><i class="material-icons" >delete</i>
                        </button>
                    {:else}
                        <NumberUnitDisplay mode="table" value={i.amount}/>
	                <!-- <span bind:clientWidth={i.awidth} class='amount'>{i.amount.amount&&float_to_frac(i.amount.amount)||''}</span>
	                     <span bind:clientWidth={i.uwidth} class='unit'>{i.amount.unit||''}</span> -->                        
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
{#if (!recursive)}
<div class="invisible">
    <svelte:self
        bind:this={invisibleCopy}
        maxWidth="none"          
        recursive="true"
        {...{ingredients,editable,editMode}}
        />
</div>
{/if}
<style>
 .invisible {
     position: absolute;
     visibility: hidden;
 }
 
.edit-mode {
  font-size : 0.8em
}
 .inglist {
     padding: 0;
     display: table;
     border-spacing: 3px;
     max-width: var(--idealWidth);
     min-width: calc(var(--idealWidth)/2)
 }
 .ing {
     /*      display: flex; */
     display: table-row;
 }
 
 .ing span {
     padding: var(--padding); 
     display: inline-block;
 }
 .ing span {
     display : table-cell;
     border-bottom: 1px solid grey;
 }
 .ing:last-child span {border-bottom: none;}
 .amount {
     /*      min-width: var(--awidth); */
 }
 .unit {
     /*      min-width: var(--uwidth); */
 }
 .item {
     /*      min-width: var(--iwidth); */
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
