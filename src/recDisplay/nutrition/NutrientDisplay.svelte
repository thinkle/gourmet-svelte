<script type="ts">
  import type { Nutrient } from "../../types/nutrientTypes";
  import MacroNutrientSummary from "./MacroNutrientSummary.svelte";
  export let nutrient: Nutrient & { rank: number };
</script>

<div>
  {nutrient.description}
  {nutrient.rank}
</div>
<div>
  <MacroNutrientSummary {nutrient} />
</div>
<div class="detail">{nutrient.brandOwner || ""} ({nutrient.dataType})</div>

<style>
  .detail {
    margin-left: auto;
    text-align: right;
  }
</style>
