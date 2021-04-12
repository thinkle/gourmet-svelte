<script type="ts">
  import { Nutrient } from "../../types/nutrientTypes";
  export let nutrient: Nutrient;
</script>

<div>
  {nutrient.description}
</div>
<div class="detail">{nutrient.brandOwner || ""} ({nutrient.dataType})</div>

<style>
  .detail {
    margin-left: auto;
    text-align: right;
  }
</style>
