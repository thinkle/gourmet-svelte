<script>
 import {formatAmount} from '../utils/numbers.js';
 export let value
 export let mode='inline'
 export let multipliable=true

 import {getContext} from 'svelte';
 let multiplier = getContext('multiplier')
 console.log('Formatting',value);
</script>

<span class:table={mode=='table'} class="amount" class:multiplied={$multiplier!=1}>
    {formatAmount(value,{multiplier:$multiplier})}
</span>
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
