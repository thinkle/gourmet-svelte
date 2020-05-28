<script>
 export let target
 import {getContext} from 'svelte';

 let highlightedIngredient = getContext('highlightedIngredient')

 function toggleHighlight () {
     if ($highlightedIngredient.highlighted != target) {
         $highlightedIngredient.highlighted=target
     }
     else {
         $highlightedIngredient.highlighted=undefined
     }
 }
 function hoverOn () {
     $highlightedIngredient.hover=target
 }
 function hoverOff () {
     $highlightedIngredient.hover=undefined
 }
 


</script>

<span
    class:hover={target==$highlightedIngredient.hover} class:highlight={target==$highlightedIngredient.highlighted}
    on:click={toggleHighlight}
    on:mouseover={hoverOn}
    on:mouseleave={hoverOff}
>
    <slot/>
</span>

<style>

 .hover {
     background-color: var(--note-light-bg);
     color: var(--note-light-fg);
 }
 
 .highlight {
     background-color: var(--note-bg);
     color: var(--note-fg);
     
 }
 span {
     font-weight: 900;
     color: #444;
 }
</style>
