<script>
 import ipsum from '../common/mocks/ipsum.js';
 export let chars=undefined
 export let graphs=undefined
 let text
 $: if (!graphs && !chars) {graphs = 2;}
 $: if (!text && graphs) {text = ipsum.generateParagraphs(graphs)}
 $: if (!text && chars) {text = ipsum.generate(chars)}
 
 function changeIpsum () {
     text = ''; // this will trigger reactive assignments to fix it
 }

</script>
<div on:click={changeIpsum}>
    {@html text}
</div>
