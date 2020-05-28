<script>
 import IconButton from '../../widgets/IconButton.svelte';
 import {getContext} from 'svelte';
 export let recursive=false;
 export let ingredients;
 export let maxWidth=250;
 export let editable = true;
 export let editMode = false;
 export let onChange = undefined;
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import NumberUnitDisplay from '../../widgets/NumberUnitDisplay.svelte'
 import IngredientInput from '../../widgets/IngredientInput.svelte'
 import FancyInput from '../../widgets/PlainInput.svelte';
 import {floatToFrac} from '../../utils/numbers.js';
 import {onMount,tick} from 'svelte';
 import {highlightItem} from '../../utils/ingredientUtils.js';
 let highlightedIngredient = getContext('highlightedIngredient');

 console.log("IngredientList created: onChange=",onChange)
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

 function changeIngredient (original, updated) {
     console.log('Replacing',original,'with',updated)
     // swap out enumerable properties of ingredient object
     for (let prop in original) {
         delete original[prop]
     }
     for (let prop in updated) {
         original[prop] = updated[prop]
     }
     ingredients = ingredients; // tell svelte it's changed
     triggerChange(); // tell parent we've changed
 }

 let focusNext

 function insertIngredient (value, list, index) {
     list[index] = value;
     let newIng = {
     }
     list.splice(index+1,0,newIng)
     // Come up with some way to focus it :(
     ingredients = ingredients; // tell svelte
     triggerChange(); // tell parent
     focusNext = newIng;
     return true;
 }
 
 function removeIngredient (list, index) {
     list.splice(index,1);
     ingredients = ingredients;
     triggerChange();
     focusNext = list[index-1]
 }

 function toggleHighlight (ingredient) {
     if ($highlightedIngredient.highlighted != ingredient.text) {
         $highlightedIngredient.highlighted = ingredient.text
     } else {
         $highlightedIngredient.highlighted = undefined
     } 
 }
 function hoverOn (ingredient) {
     $highlightedIngredient.hover = ingredient.text
 }
 function hoverOff (ingredient) {
     $highlightedIngredient.hover = undefined
 }

</script>

<div style="max-width:{maxWidth}px;">
    <table bind:this={ref}  class:edit-mode={editMode} class="inglist" style={getStyle(idealWidth)}>
	{#each ingredients as i,n (i)}
            {#if i.ingredients}
                <!-- nested ingredients...! -->
                <tr class:highlighted={i.text==$highlightedIngredient.highlighted}
                                      class:hover={i.text==$highlightedIngredient.hover}
                    class:ing={!i.ingredients} class:grouphead={i.ingredients}>
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
                            {#each i.ingredients as ii,nn (ii)}
	                        <tr class='ing'
                                           class:highlighted={ii.text==$highlightedIngredient.highlighted}
                                           class:hover={ii.text==$highlightedIngredient.hover}
                                >
                                           {#if editMode}
                                           <td colspan="4">
                                           <IngredientInput
                                           onChange={(v)=>changeIngredient(ii,v)}
                                           onEnter={(v)=>insertIngredient(v,i.ingredients,nn)}
                                           onDelete={()=>{removeIngredient(i.ingredients,nn)}}
                                           shouldFocus={focusNext===ii}
                                           ing={ii}
                                />
                                           </td>
                                           <!-- <NumberUnitInput on:change={triggerChange} mode="table" label={false} bind:value={ii.amount}/>
                                           <td>
                                           <label>Item:</label> 
                                           <FancyInput on:change={triggerChange} bind:value={ii.text} placeholder="Ingredient"/>
                                           </td> -->
                                           <IconButton 
                                           bare={true} 
                                           icon="delete"
                                           on:click="{()=>{removeIngredient(i.ingredients,nn)}}"/>
                                           {:else}
                                           <NumberUnitDisplay  mode="table" value={ii.amount}/>
	                                   <td
                                             on:click={()=>toggleHighlight(ii)}
                                             on:mouseover={()=>hoverOn(ii)}
                                             on:mouseleave={()=>hoverOff(ii)}
                                           >
                                           <span class='item'>{@html highlightItem(ii)}</span>
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
        <tr class='ing'
            class:highlighted={i.text==$highlightedIngredient.highlighted}
            class:hover={i.text==$highlightedIngredient.hover}
            >
                    <!-- standard ingredient row -->
                    {#if editMode}
                        <td colspan="4">
                            <IngredientInput
                                onEnter={(v)=>insertIngredient(v,ingredients,n)}
                                        onChange={(v)=>changeIngredient(i,v)}
                                onDelete={()=>{removeIngredient(ingredients,n)}}
                                        shouldFocus={focusNext===i}
                                ing={i}
                            />
                        </td>
                        <td>
                            <IconButton bare={true} on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients;triggerChange()}}" icon="delete"/>
                        </td>
                        <!-- <NumberUnitInput on:change={triggerChange} mode="table" label={false} bind:value={i.amount}/>
                             <td>
                             <label>Item:</label> 
                             <FancyInput on:change={triggerChange} placeholder="Ingredient" bind:value={i.text}/>
                             </td>
                             <td>
                             <IconButton bare={true} on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients;triggerChange()}}" icon="delete"/>
                             </td> -->
                    {:else}
                        <NumberUnitDisplay mode="table" value={i.amount}/>
	                <td
                          on:click={()=>toggleHighlight(i)}
                          on:mouseover={()=>hoverOn(i)}
                          on:mouseleave={()=>hoverOff(i)}
                          >
                            <span class='item'>{@html highlightItem(i)}</span>
                        </td>
                    {/if}
                </tr>
            {/if}
	{/each}
        {#if editMode}
            <tr>
                <td colspan=3>
                    <IngredientInput onEnter={(ing)=>{ingredients = [...ingredients,ing]; return true}}/>
                </td>
                <td>
                    <IconButton bare={true} icon="add"/>
                </td>
            </tr>
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
     border-spacing: 3px;
     max-width: var(--idealWidth);
     min-width: calc(var(--idealWidth)/2)
 }
 .ing > :global(td) {
     border-bottom: 1px solid var(--light-underline);
 }
 .ing:last-child > :global(td) {
     border-bottom: none;
 }
 .ing :global(.amount,.unit,.item) {
     font-family: var(--recipeFont);     
 }
 .grouphead {
     font-weight: bold;
 }
 .grouphead .ing {
     font-weight: normal;
 }
 .grouphead .text {
     font-family: var(--recipeHeadFont);
 }
 .grouphead .ing .text {
     font-family : var(--recipeFont);
 }

 .grouphead > input {
     font-weight: bold;
 }
 .highlighted {
     background-color: var(--note-bg);
     color: var(--note-fg);
     font-weight: bold;
 }
 .hover {
     background-color: var(--note-light-bg);
     color: var(--note-light-fg);
 }

 
</style>
