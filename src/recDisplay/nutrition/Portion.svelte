<script>
  import { JsonDebug } from "../../widgets/index";
  import DensityIndicator from "./DensityIndicator.svelte";
  export let portion;
  let amount = portion.amount;
  $: if (portion) {
    amount = portion.amount;
  }
  import { highlightItemText } from "../../utils/ingredientUtils";
</script>

<div class="portion">
  <div class="text">{@html highlightItemText(portion.foodDescription)}</div>
  <div class="amount">
    {#if amount?.density}
      <DensityIndicator density={amount.density} />
    {:else}
      {amount.amount || ""} {amount.unit || ""} {amount.unitModifier || ""}
    {/if}
  </div>
</div>

<style>
  .portion {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
  }
  .amount {
    margin-left: auto;
  }
</style>
