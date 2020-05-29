<script>
 import {registerBuild} from '../../stores/debug.js'; registerBuild(BUILD_MS);
 export let ing
 export let edit
 export let onChange
 export let onEnter
 export let onDelete
 export let shouldFocus
 export let onOpenSubRec
 import NumberUnitDisplay from '../../widgets/NumberUnitDisplay.svelte'
 import NumberUnitInput from '../../widgets/NumberUnitInput.svelte'
 import IngredientInput from '../../widgets/IngredientInput.svelte';
 import IconButton from '../../widgets/IconButton.svelte';
 import {getContext} from 'svelte';

 /* Linked Recipe opener */
 function handleReferenceClick (event) {
     if (onOpenSubRec) {
         onOpenSubRec(ing.reference);
         event.preventDefault();
     } else {
         console.log('No handler: go ahead and open');
     }
 }

 /* Magic Highlighting Code */
 import {scrollIntoView} from '../../utils/scrolling.js';
 import {highlightItem} from '../../utils/ingredientUtils.js';
 let highlightedIngredient = getContext('highlightedIngredient');
 let highlightersActive
 $: highlightersActive = ing && $highlightedIngredient.active && $highlightedIngredient.active.indexOf(ing.text) > -1;

 function toggleHighlight (ingredient) {
     if (!highlightersActive) {return}
     if ($highlightedIngredient.highlighted != ingredient.text) {
         $highlightedIngredient.highlighted = ingredient.text
         $highlightedIngredient.scrolledIngFor = ingredient.text // don't scroll ing on click
     } else {
         $highlightedIngredient.highlighted = undefined
     } 
 }
 function hoverOn (ingredient) {
     if (!highlightersActive) {return}
     $highlightedIngredient.hover = ingredient.text
 }
 function hoverOff (ingredient) {
     if (!highlightersActive) {return}
     $highlightedIngredient.hover = undefined
 }

 import {derived} from 'svelte/store'
 let highlightedItem =  derived(highlightedIngredient,($highlightedIngredient)=>$highlightedIngredient.highlighted);
 function scroll (node,highlighted) {
     return {
         update (highlighted) {
             if (highlighted===ing.text && $highlightedIngredient.scrolledIngFor!==ing.text) {
                 scrollIntoView(node);
                 $highlightedIngredient.scrolledIngFor = ing.text;
             }              
         }
     }
 }
 /* End highlighting code */

</script>
{#if ing}
    {#if ing.reference} <!-- Recipes as ingredients (embedded...) -->
        <tr class="ing ingref" >
            {#if edit}
                <NumberUnitInput
                    bind:value="{ing.amount}"
                    {onChange}
                />
                <td>FIX ME</td>
            {:else}
                <NumberUnitDisplay
                    mode="table"
                    value="{ing.amount}"
                />
                <td
                    class="link"
                >
                    <a target="_blank" href="/rec/{ing.reference}"
                       on:click="{handleReferenceClick}"
                    >{ing.text}</a>
                </td>

            {/if}
        </tr>
    {:else} <!-- Standard Ingredient -->
        <tr class="ing"
            class:highlighted="{ing.text==$highlightedIngredient.highlighted}"
            class:hover="{ing.text==$highlightedIngredient.hover}"
            use:scroll="{$highlightedItem}"
        >
            {#if edit}
                <!-- Editor -->
                <td colspan="3">
                    <IngredientInput
                        {onChange}
                        {onDelete}
                        {onEnter}
                        {shouldFocus}  
                        {ing}
                    />
                </td>
                <td>
                    <IconButton
                        small="{true}"
                        bare="{true} "
                        icon="delete"
                        on:click="{onDelete}"
                    />
                </td>
            {:else}
                <!-- Display -->
                <NumberUnitDisplay  mode="table" value={ing.amount}/>
	        <td
                    on:click="{()=>toggleHighlight(ing)}"
                    on:mouseover="{()=>hoverOn(ing)}"
                    on:mouseleave="{()=>hoverOff(ing)}"
                >
                    <span class='item'>{@html highlightItem(ing)}</span>
                </td>
            {/if}
        </tr>
    {/if}
{:else}
    <tr>
        Error: null ingredient
    </tr>
{/if}

<style>
 .link {
     color : --var(link);
 }
 .link:hover {
     text-decoration : underline;
 }
 .ing :global(.amount,.unit,.item) {
     font-family: var(--recipeFont);     
 }
 .ing > :global(td) {
     border-bottom: 1px solid var(--light-underline);
 }
 .ing:last-child > :global(td) {
     border-bottom: none;
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
