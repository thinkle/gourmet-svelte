<script type="ts">
  import type { Nutrient } from "../../types/nutrientTypes";
  import MacroNutrientSummary from "./MacroNutrientSummary.svelte";
  export let nutrient: Nutrient & { rank?: number };
  export let grams: number = 100;
</script>

<div class="nutrient">
  <div class="description">
    {nutrient.description}
    {nutrient.rank}
    <span class="detail">{nutrient.brandOwner || ""} ({nutrient.dataType})</span
    >
  </div>
  <div class="right">
    <MacroNutrientSummary {nutrient} {grams} />
  </div>
</div>

<style>
  .nutrient {
    display: flex;
    flex-direction: row;
  }
  .right {
    margin-left: auto;
  }
  .description {
    max-width: calc(min(200px, 100vh));
    white-space: normal;
  }
  .detail {
    margin-left: auto;
    text-align: right;
  }
</style>
