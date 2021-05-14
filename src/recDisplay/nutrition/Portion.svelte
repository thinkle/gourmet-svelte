<script type="ts">
  import type { PortionAmount, Portion } from "../../types/nutrientTypes";
  import { JsonDebug } from "../../widgets/index";
  import DensityIndicator from "./DensityIndicator.svelte";
  export let portion: Portion;
  let amount = portion.amount;
  $: if (portion) {
    amount = portion.amount;
  }
  import { highlightItemText } from "../../utils/ingredientUtils";

  function getDisplayUnit(amount: PortionAmount) {
    if (!amount) {
      return "";
    }
    if (amount.unitModifier) {
      if (amount.unitModifier.indexOf(amount.unit) > -1) {
        return amount.unitModifier;
      } else {
        return amount.unit + " " + amount.unitModifier;
      }
    } else if (amount.unit) {
      return amount.unit;
    } else {
      return "";
    }
  }
</script>

<div class="portion">
  <div class="text">{@html highlightItemText(portion.foodDescription)}</div>
  <div class="amount">
    <span class:small={!!amount.density}>
      {amount.amount || ""}
      {getDisplayUnit(amount)}
    </span>
    {#if amount?.density}
      <DensityIndicator density={amount.density} />
    {:else}
      <b>{amount.gramWeight}g</b>
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
    display: flex;
    align-items: center;
  }
  .small {
    font-size: small;
  }

  b {
    display: inline-flex;
    background-color: var(--accent-fg);
    color: var(--accent-bg);
    font-weight: normal;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    height: 50px;
    width: 50px;
  }
</style>
