<script>
 import RecipeTextStyle from './RecipeTextStyle.svelte';
 import {HtmlBlock,
         TimeLink} from '../../widgets/';

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
<RecipeTextStyle>
    <h2>{header}</h2>
    {#each [parsed] as _ (parsed)} <!-- Make it rerender when parsed changes -->
        <HtmlBlock markupToComponentMap={markupToComponentMap} content={parsed}/>
    {/each}
</RecipeTextStyle>

