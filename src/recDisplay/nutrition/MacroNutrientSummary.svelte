<script type="ts">
  import type { Nutrient } from "../../types/nutrientTypes";
  import { getNutrientById } from "./nutrientUtils";
  export let nutrient: Nutrient;
  export let width: number = 50;
  const KCAL = 1008;
  let kcal = 0;
  $: kcal = getNutrientById(nutrient, KCAL).amount;
  const macros = [
    { id: 1004, name: "fat", color: "#FFC525", multiplier: 9 },
    { id: 1005, name: "carbs", color: "#A68461", multiplier: 4 },
    { id: 1003, name: "protein", color: "#E87D1D", multiplier: 4 },
  ];

  /* const foodDensityItems = [
    { id: 1079, name: "Dietary Fiber", color: "green", multiplier: 10 },
    { id: 1051, name: "Water", color: "blue", multiplier: 1 },
  ]; */

  function getMacros(nutrient) {
    let total = getNutrientById(nutrient, KCAL).amount;
    let lastPercentage = 0;
    macros.forEach((macro) => {
      macro.amount = getNutrientById(nutrient, macro.id).amount;
      macro.kcal = macro.amount * macro.multiplier;
      macro.percentage = macro.kcal / total;
      macro.previousMacrosPercentage = lastPercentage;
      lastPercentage = macro.percentage + lastPercentage;
    });
    /* foodDensityItems.forEach((item, n) => {
      item.amount = getNutrientById(nutrient, item.id).amount;
      item.percentage = (item.amount * item.multiplier) / 100;
      if (n) {
        item.x = width - item.percentage * width;
      } else {
        item.x = 0;
      }
    }); */
  }

  $: getMacros(nutrient);
</script>

<div>
  <div class="kcal" style={`width:${width}px`}>
    <svg {width}>
      {#each macros as macro}
        <rect
          x={width * macro.previousMacrosPercentage}
          y={0}
          width={width * macro.percentage}
          height={200}
          fill={macro.color}
        />
      {/each}
      <rect x={0} y={50 / 2 - 10} height={20} {width} fill="blue" />
      <!-- Calorie bar... let's assume 8 cals / gram is maximum density... -->
      <rect
        x={0}
        y={50 / 2 - 10}
        width={width * (kcal / 800)}
        height={20}
        fill="black"
      />
    </svg>
    <div>{kcal}</div>
  </div>
</div>

<style>
  .kcal {
    display: flex;
    flex-direction: row;
    border: 2px solid black;
    position: relative;
    height: var(--bar-height);
    justify-content: center;
  }
  .kcal div {
    font-weight: bold;
    text-shadow: var(--black, black);
    color: var(--white, white);
    text-align: center;
    align-self: center;
    z-index: 2;
  }
  .macro {
    overflow: hidden;
    border: 1px solid pink;
  }
  svg {
    height: var(--bar-height);
    border-radius: 10px;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
