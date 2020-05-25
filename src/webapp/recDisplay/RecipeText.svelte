<script>
 import HtmlBlock from '../../widgets/HtmlBlock.svelte';
 import TimeLink from '../../widgets/TimeLink.svelte';
 export let value;
 export let header=''
 export let text=''
 $: if (value) header = value.header
 $: if (value) text = value.body
 //text = parseTimes(text);
 
 import {parseTimes} from '../../utils/times.js';
 $: {
     //console.log('Parsing text: ',text);
     text = parseTimes(text);
     //console.log('Success:',text)
 }
 
 let markupToComponentMap = {
     DURATION : TimeLink,
 }


</script>
<div>
    <h2>{header}</h2>
    <HtmlBlock markupToComponentMap={markupToComponentMap} content={text}/>    
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
</style>
