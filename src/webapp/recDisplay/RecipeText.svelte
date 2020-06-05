<script>
 import HtmlBlock from '../../widgets/HtmlBlock.svelte';
 import TimeLink from '../../widgets/TimeLink.svelte';
 import IngHighlight from './IngHighlight.svelte';
 export let value;
 export let header=''
 export let text=''
 $: if (value) header = value.header
 $: if (value) text = value.body
 import {getContext} from 'svelte'
 let ingredientList = getContext('ingredientList');
 //text = parseTimes(text);
 import {parseTimes} from '../../utils/times.js';
 import {parseIngredients} from '../../utils/ingredientUtils.js';
 let parsed
 $: {
     console.log('Parsing text: ',text);
     if (text) {
         if (ingredientList && $ingredientList && $ingredientList.length > 1) {
             parsed = parseIngredients(text,$ingredientList);
         } else {
             parsed = text;
         }
         parsed = parseTimes(parsed);
     }
 }
 
 let markupToComponentMap = {
     DURATION : TimeLink,
     ING: IngHighlight,
 }


</script>
<div>
    <h2>{header}</h2>
    {#each [parsed] as _ (parsed)} <!-- Make it rerender when parsed changes -->
        <HtmlBlock markupToComponentMap={markupToComponentMap} content={parsed}/>
    {/each}
</div>
<style>
 h2 {
     font-family : var(--recipeHeadFont);
     font-weight: bold;
     font-size: 1.5rem;
 }
 div {
     font-family: var(--recipeFont);
     font-size : 1rem;
     line-height: 1.4;
     max-width: 45em; /* readability... */
 }

 div :global(h1),div :global(h2),div :global(h3),div :global(h4),div :global(h5),div :global(h6) {
     margin-bottom: 3px;
     border-bottom: 1px solid var(--light-underline);
 }
 div :global(ol) {
     list-style: none;
     counter-reset: my-awesome-counter;
     padding-left: 2rem;
 }

 div :global(ol li) {
     margin-top: 1rem;
     counter-increment: my-awesome-counter;
     position: relative;
 }

 div :global(ol li::before) {
     content: counter(my-awesome-counter);
     color: white;
     background-color: var(--accent-bg);
     font-weight: var(--accent-fg);
     position: absolute;
     left: -2rem;
     font-size: 1.5rem;
     border-radius: 3px;
     padding: 4px;
 }

 
</style>
