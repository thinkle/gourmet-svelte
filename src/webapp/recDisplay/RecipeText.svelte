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
 }

 div :global(h1),div :global(h2),div :global(h3),div :global(h4),div :global(h5),div :global(h6) {
     margin-bottom: 3px;
     border-bottom: 1px solid var(--light-underline);
 }
 
</style>
