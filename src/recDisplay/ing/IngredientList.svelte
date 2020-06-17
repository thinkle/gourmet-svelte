<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 import Ingredient from './Ingredient.svelte';
 import {getContext} from 'svelte';
 export let recursive=false;
 export let ingredients;
 export let maxWidth=undefined;
 export let editable = true;
 export let editMode = false;
 export let onChange = undefined;
 export let onOpenSubRec = undefined;
 import {IconButton,IngredientInput,PlainInput} from '../../widgets/';

 import {floatToFrac} from '../../utils/numbers.js';
 import {onMount,tick} from 'svelte';
 import {flip} from 'svelte/animate'
 import {highlightItem} from '../../utils/ingredientUtils.js';
 let highlightedIngredient = getContext('highlightedIngredient');
 let groups;

 $: groups = ingredients.filter((i)=>i.ingredients)
 
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
     if (original !== updated) {
         // swap out enumerable properties of ingredient object
         for (let prop in original) {
             delete original[prop]
         }
         for (let prop in updated) {
             original[prop] = updated[prop]
         }
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

 function moveIngredient (list, index, delta, newParent) {
     let item = list[index]
     list.splice(index,1);
     if (newParent) {
         if (newParent=='top') {
             ingredients.push(item);
         }
         else {
             newParent.push(item);
         }
     } else {
         list.splice(index+delta,0,item);
     }
     ingredients = ingredients; // tell svelte something happened
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
 function addIngredient (list=ingredients,ingredient={text:'',amount:{}},focus=false) {
     list.push(ingredient);
     ingredients = ingredients;
     triggerChange();
     if (focus) {
         focusNext = ingredient
     }
     return true; // when used as a direct handler, tells us to clear entry after adding.
 }

</script>

<div style="max-width:{maxWidth}px;">
    <table bind:this={ref}  class:edit-mode={editMode} class="inglist" style={getStyle(idealWidth)}>
	{#each ingredients as i,n (i)}
            <tbody animate:flip>
            {#if i.ingredients}
                <!-- nested ingredients...! -->
                <tr class:highlighted={i.text==$highlightedIngredient.highlighted}
                                      class:hover={i.text==$highlightedIngredient.hover}
                    class:ing={!i.ingredients} class:grouphead={i.ingredients}>
                    <td colspan="4">
                        {#if editMode}
                            <div style="display: flex">
                            <PlainInput shouldFocus={focusNext==i} on:change={triggerChange} bind:value={i.text} placeholder="Ingredient Group"/>
                            {#if (i.ingredients.length==0)}
                                <button on:click="{()=>{ingredients.splice(n,1);ingredients=ingredients;triggerChange() }}">
                                    <i class="material-icons" >delete</i>
                                </button>
                            {/if}
                            </div>
                        {:else}
                            <h3>{i.text}</h3>
                        {/if}
                        <table class="inglist">
                            {#each i.ingredients as ii,nn (ii)}
                                <tbody animate:flip>
                                <Ingredient
                                    ing="{ii}"
                                    {onOpenSubRec}
                                    onMove="{(delta,newParent)=>moveIngredient(i.ingredients,nn,delta,newParent)}"
                                    onChange="{(v)=>changeIngredient(ii,v)}"
                                    onEnter="{(v)=>insertIngredient(v,i.ingredients,nn)}"
                                    onDelete="{()=>removeIngredient(i.ingredients,nn)}"
                                    shouldFocus="{focusNext===ii}"
                                    edit="{editMode}"
                                    {groups}
                                    parent={i.ingredients}
                                    position={nn}
                                />
                                </tbody>
                            {/each}
                            <!-- Button for adding more rows... -->
                            {#if editMode}
                                <tr>
                                    <td colspan="4" class="new">
                                        <IngredientInput
                                            placeholder="{
                                                         i.ingredients.length==0 
                                                         ? `First ingredient in ${i.text||'new group'}`
                                                         : `Next ingredient in ${i.text||'untitled group'}`}"
                                            showAddButton="true"
                                            onEnter="{(newIng)=>addIngredient(i.ingredients,newIng)}"
                                        />                                    
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
                    onMove="{(delta,newParent)=>moveIngredient(ingredients,n,delta,newParent)}"
                    onChange="{(v)=>changeIngredient(i,v)}"
                    onDelete="{()=>{removeIngredient(ingredients,n)}}"
                    shouldFocus="{focusNext===i}"
                    ing="{i}"
                    edit="{editMode}"
                    {groups}
                    parent={ingredients}
                    position={n}
                />
            {/if} <!-- End if nested ingredient block -->
            </tbody>
	{/each} <!-- End each i in ingredients -->
        
        {#if editMode}
            <tr>
                <td colspan="4" class="new">
                    <IngredientInput
                        showAddButton="true"
                        placeholder="{
                                       ingredients.length==0 ? 'e.g. 1 cup sugar' 
                                       : 'Type next ingredient…'
                                       }"
                        onEnter="{(newIng)=>addIngredient(ingredients,newIng)}"/>
                </td>
            </tr>
            <tr>
                <td>
                    
                </td>
                <td>
                    <IconButton icon="add" bare="true"
                                on:click="{()=>addIngredient(ingredients,{text:'',amount:{}},true)}"
                                type="icon">
                    </IconButton>
                </td>
                <td>
                    <IconButton
                        icon='collections'
                        bare='true'
                        on:click="{()=>{
                                  addIngredient(
                                      ingredients,
                                      {text:'',ingredients:[] },
                                      true // focus
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
     width: 100%;
     /* max-width: var(--idealWidth); */
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

 .inglist .inglist {
     border-left : 1px solid var(--light-underline);
     border-bottom : 1px solid var(--light-underline);
 }
 /* .inglist .inglist > :global(tr td:first-child),
    .inglist .inglist > :global(tbody td:first-child) {
    padding-left: 13px;
    } */
 
 .inglist {
     border-collapse: separate;
     border-spacing: 0.3rem 1.5rem;
 }
 
 .new {
     color: var(--grey);
     font-style: italic;
 }
</style>
