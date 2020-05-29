<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(BUILD_MS,'IL');
 import Ingredient from './Ingredient.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 import {getContext} from 'svelte';
 export let recursive=false;
 export let ingredients;
 export let maxWidth=250;
 export let editable = true;
 export let editMode = false;
 export let onChange = undefined;
 export let onOpenSubRec = undefined;
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
     console.log('Ingredients trigger change!')
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
 function addIngredient (list=ingredients,ingredient={text:'',amount:{}}) {
     ingredients.push(ingredient);
     ingredients = ingredients;
     triggerChange();
     return true; // when used as a direct handler, tells us to clear entry after adding.
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
                                <Ingredient
                                    ing="{ii}"
                                    {onOpenSubRec}
                                    onChange="{(v)=>changeIngredient(ii,v)}"
                                    onEnter="{(v)=>insertIngredient(v,i.ingredients,nn)}"
                                    onDelete="{()=>removeIngredient(i.ingredients,nn)}"
                                    shouldFocus="{focusNext===ii}"
                                    edit="{editMode}"
                                />
                            {/each}
                            <!-- Button for adding more rows... -->
                            {#if editMode}
                                <tr>
                                    <td>
                                        <IconButton icon="add" bare="true"
                                                    on:click="{()=>{addIngredient(i.ingredients)}}"
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
                <!-- Non nested ingredient -->
                <Ingredient
                    {onOpenSubRec}
                    onEnter="{(v)=>insertIngredient(v,ingredients,n)}"
                    onChange="{(v)=>changeIngredient(i,v)}"
                    onDelete="{()=>{removeIngredient(ingredients,n)}}"
                    shouldFocus="{focusNext===i}"
                    ing="{i}"
                    edit="{editMode}"
                />
            {/if} <!-- End if nested ingredient block -->
	{/each} <!-- End each i in ingredients -->
        {#if editMode}
            <tr>
                <td colspan=3>
                    <IngredientInput onEnter={(i)=>addIngredient(ingredients,i)}/>
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
                                on:click="{addIngredient}"
                                type="icon">
                    </IconButton>
                </td>
                <td>
                    <IconButton
                        icon='collections'
                        bare='true'
                        on:click="{()=>{
                                  addIngredient(
                                      {text:'',ingredients:[] }
                                  )
                                  }}"
                    >
                        New Group
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
 .grouphead :global(.ing) {
     font-weight: normal;
 }
 .grouphead :global(.text) {
     font-family: var(--recipeHeadFont);
 }
 .grouphead :global(.ing .text) {
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
