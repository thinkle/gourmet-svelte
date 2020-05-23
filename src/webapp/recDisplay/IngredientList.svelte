<script>
 import IconButton from '../../widgets/IconButton.svelte';
 import {getContext} from 'svelte';
 export let recursive=false;
 export let ingredients;
 export let maxWidth=250;
 export let editable = true;
 export let editMode = false;
 export let onChange
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import NumberUnitDisplay from '../../widgets/NumberUnitDisplay.svelte'
 import FancyInput from '../../widgets/PlainInput.svelte';
 import {floatToFrac} from '../../utils/numbers.js';
 import {onMount} from 'svelte';
 let recipeChanges = getContext('recipeChanges');

 function triggerChange () {
     onChange && onChange(ingredients)
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
    <table bind:this={ref}  class:edit-mode={editMode} class="inglist" style={getStyle(idealWidth)}>
	{#each ingredients as i,n}
            {#if i.ingredients}
                <!-- nested ingredients...! -->
                <tr class:ing={!i.ingredients} class:grouphead={i.ingredients}>
                    <td colspan="4">
                        {#if editMode}
                            <FancyInput on:change={triggerChange} bind:value={i.text} placeholder="Ingredient Group"/>
                            {#if (i.ingredients.length==0)}
                                <button on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients;triggerChange() }}">
                                    <i class="material-icons" >delete</i>
                                </button>
                            {/if}
                        {:else}
                            <h3>{i.text}</h3>
                        {/if}
                        <table class="inglist">
                            {#each i.ingredients as ii,nn}
	                        <tr class='ing'>
                                    {#if editMode}
                                        <NumberUnitInput on:change={triggerChange} mode="table" label={false} bind:value={ii.amount}/>
                                        <td>
                                            <label>Item:</label> 
                                            <FancyInput on:change={triggerChange} bind:value={ii.text} placeholder="Ingredient"/>
                                        </td>
                                        <button on:click="{()=>{i.ingredients.splice(nn,1);ingredients=ingredients;triggerChange()}}"><i class="material-icons" >delete</i>
                                        </button>
                                    {:else}
                                        <NumberUnitDisplay  mode="table" value={ii.amount}/>
	                                <td>
                                            <span class='item'>{ii.text}</span>
                                        </td>
                                    {/if}
                                </tr>
                            {/each}
                            <!-- Button for adding more rows... -->
                            {#if editMode}
                                <tr>
                                    <td>
                                        <IconButton icon="add" bare="true"
                                                    on:click="{()=>{i.ingredients.push({text:'',amount:{}});ingredients=ingredients}}"
                                                    type="icon"><i class='material-icons'/>
                                        </IconButton>
                                    </td>
                                </tr>
                            {/if}
                        </table>
                    </td>
                    <!-- end of nested table -->
                </tr>
            {:else}
                <tr> <!-- standard ingredient row -->
                    {#if editMode}
                        <NumberUnitInput on:change={triggerChange} mode="table" label={false} bind:value={i.amount}/>
                        <td>
                            <label>Item:</label> 
                            <FancyInput on:change={triggerChange} placeholder="Ingredient" bind:value={i.text}/>
                        </td>
                        <td>
                            <IconButton on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients;triggerChange()}}" icon="delete" bare="true"/>
                        </td>
                    {:else}
                        <NumberUnitDisplay mode="table" value={i.amount}/>
	                <td>
                            <span class='item'>{i.text}</span>
                        </td>
                    {/if}
                </tr>
            {/if}
	{/each}
        {#if editMode}
            <tr>
                <td>
                </td>
                <td>
                    <IconButton icon="add" bare="true"
                                on:click="{()=>{ingredients.push({text:'',amount:{}});ingredients=ingredients;triggerChange()}}"
                                type="icon">
                    </IconButton>
                </td>
                <td>
                    <IconButton
                        icon='collections'
                        bare='true'
                        on:click="{()=>{ingredients.push({item:'',ingredients:[
                                  ]});ingredients=ingredients}}"
                    >New Group
                    </IconButton>
                </td>
            </tr>
        {/if}
    </table>
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
