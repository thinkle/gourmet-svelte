<script>
 import HtmlBlock from '../../widgets/HtmlBlock.svelte';
 import TimeLink from '../../widgets/TimeLink.svelte';
 export let value;
 export let header=''
 export let text=''
 $: if (value) header = value.header
 $: if (value) text = value.body
 import {parseTimes} from '../../utils/times.js';
 $: text = parseTimes(text);

 let markupToComponentMap = {
     DURATION : TimeLink,
 }

</script>
<div>
    <h2>{header}</h2>
    <HtmlBlock markupToComponentMap={markupToComponentMap} content={text}/>    
</div>

