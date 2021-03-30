<script>
    import {JsonDebug} from '../../widgets/index';
  export let portion;
  let amount = portion.amount
  $: if (portion) {amount = portion.amount}

</script>
{#if amount}
<br>{amount.amount||''} {amount.unit||''} {amount.unitModifier||''}
{amount.gramWeight}g{#if amount.ml}/{amount.ml}ml ({amount.gramWeight/amount.ml}){/if} 
of {portion.foodDescription} 
{/if}

<JsonDebug data={portion}/>
