<script>
 import {registerBuild} from '../stores/debug.js'; registerBuild(Number("BUILD_MS"));
 export let amount
 export let total
 let percentage
 export let width;
 $: percentage = amount && total && (amount * 100 / total).toFixed(2) || 100;

 function getStyle (per) {
     console.log('get style',per);
     return `width:${per}%;`
 }

</script>
<div class="total" style={`--pwidth:${width};`}>
    <div class="complete" style={getStyle(percentage)}>
    </div>
    <div class="label">{amount&&amount.toFixed(0)||0} {#if total}of {total}{/if}
    </div>
</div>
<style>
 .total {width:var(--pwidth);
        background-color: #acacfe;
        color: #232323;
        text-align: center;
        position: relative;
        }
 .complete {
     background-color: #232377;
     color: #ccdcfe;
     font-weight: bold;
     font-size: 1rem;
     border: 1px solid blue;
     box-sizing: border-box;
     height: 1.5rem;
     transition: all 300ms;
     
 }
 .label {
     position: absolute;
     top : 0;
     width: 100%;
     color: #ccdcfe;
     z-index: 99;
 }
</style>
