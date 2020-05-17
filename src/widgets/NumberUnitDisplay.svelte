<script>
 import {floatToFrac} from '../utils/numbers.js';
 export let value
 export let mode='inline'
 export let multipliable=true

 import {getContext} from 'svelte';
 let multiplier = getContext('multiplier')

 let displayAmount
 $: {
     if (multipliable) {
         displayAmount = value && value.amount && value.amount * $multiplier
     }
     else {
         displayAmount = value && value.amount
     }
 }

</script>

<span class:table={mode=='table'} class="amount" class:multiplied={$multiplier!=1}>{floatToFrac(displayAmount)}</span>
&nbsp;
<span class:table={mode=='table'} class="unit" >{value.unit||''}</span>


<style>
 .multiplied {
     font-style: italic;
 }

 .table {
     display: table-cell
 }

</style>
