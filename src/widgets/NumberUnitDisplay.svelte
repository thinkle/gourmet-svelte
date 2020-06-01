<script>
 import {formatAmount} from '../utils/numbers.js';
 export let value
 export let mode='inline'
 /*  export let multipliable=true */

 import {getContext} from 'svelte';
 let multiplier = getContext('multiplier')
</script>
{#if value}
    {#if mode=='table'}
        <td class="amount" class:multiplied={$multiplier!=1}>
            {formatAmount(value,{multiplier:$multiplier})}
        </td>
        &nbsp;
        <td class="unit" >{value.unit||''}</td>

    {:else}
        <span class="amount" class:multiplied={$multiplier!=1}>
            {formatAmount(value,{multiplier:$multiplier})}
        </span>
        &nbsp;
        <span class="unit" >{value.unit||''}</span>
    {/if}
{:else if (mode=='table')}
    <td class='amount'></td>
    <td class='unit'></td>
{/if}

<style>
 .multiplied {
     font-style: italic;
 }

 .table {
     display: table-cell
 }
 .amount {
     white-space: nowrap;
 }
</style>
