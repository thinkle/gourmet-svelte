<script>
 import {registerBuild} from '../../stores/debugStore.js'; registerBuild(Number("BUILD_MS"));
 export let ing
 export let edit
 export let groups
 export let onChange
 export let onEnter
 export let onDelete
 export let onMove
 export let shouldFocus
 export let onOpenSubRec
 export let parent
 export let position

 import {NumberUnitDisplay,
         IconButton} from '../../widgets/';

 import IngredientEditor from './IngredientEditor.svelte';

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
 $: highlightersActive = ing && $highlightedIngredient && $highlightedIngredient.active && $highlightedIngredient.active.indexOf(ing.text) > -1;

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
 let highlightedItem =  derived(highlightedIngredient,($highlightedIngredient)=>$highlightedIngredient && $highlightedIngredient.highlighted);
 function scroll (node,highlighted) {
     return {
         update (highlighted) {
             if (highlighted===ing.text && $highlightedIngredient && $highlightedIngredient.scrolledIngFor!==ing.text) {
                // Use a timeout so that when we're in pop-in stacked mode, we wait for the ingredients to 
                // fly in using a transform before we scroll the ingredient we want to the center. 
                setTimeout(
                     ()=>{
                         scrollIntoView(node)
                     },
                     300
                 );
                 $highlightedIngredient.scrolledIngFor = ing.text;
             }              
         }
     }
 }
 /* End highlighting code */

</script>

{#if ing}
    <tr class="ing" class:ingref="{ing.reference}"
        class:highlighted="{$highlightedIngredient&&ing.text==$highlightedIngredient.highlighted}"
        class:hover="{$highlightedIngredient&&ing.text==$highlightedIngredient.hover}"
        use:scroll="{$highlightedItem}"
    >
        {#if edit}
            <IngredientEditor
                 {onChange}
                 {onMove}
                 {onEnter}
                 {onDelete}
                 {shouldFocus}
                 {groups}
                 {parent}
                 {position}
                 bind:ing="{ing}"
                 /> 
        {:else if ing.reference} <!-- Recipes as ingredients (embedded...) -->
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
        {:else} <!-- Standard Ingredient -->
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
 /* .ing :global(td) {
    padding-top: 3px;
    padding-bottom: 3px;
    } */
 .ing :global(.amount,.unit,.item) {
     font-family: var(--recipeFont);     
 }

 .ing :global(.amount) {
     white-space : nowrap;
     text-align: right;
 }
 .ing > :global(td) {
     border-bottom: 1px solid var(--light-underline);
 }

 /* .ing > :global(td:first-child) {
    padding-left: 0;
    }

    .ing > :global(td) {
    padding-left: 1em;
    } */
 
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
