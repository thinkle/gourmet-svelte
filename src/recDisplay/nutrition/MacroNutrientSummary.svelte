<script type="ts">
  import type { Nutrient } from "../../types/nutrientTypes";
  import { getNutrientById } from "./nutrientUtils";
  export let nutrient: Nutrient;
  export let width: number = 75;
  export let grams: number = 100;
  const height = 75;
  const KCAL = 1008;
  let kcal = 0;
  $: kcal = getNutrientById(nutrient, KCAL).amount * (grams / 100);
  const macros = [
    //{ id: 1008, name: "kc", color: "red", max: 900, amount: 0 },
    { id: 1004, name: "F", color: "#FFC525", max: 100, amount: 0 },
    { id: 1005, name: "C", color: "#A68461", max: 100, amount: 0 },
    { id: 2000, name: "S", color: "#AB3232", max: 100, amount: 0 },
    { id: 1003, name: "P", color: "#E87D1D", max: 100, amount: 0 },
    { id: 1079, name: "Fiber", color: "#239823", max: 20, amount: 0 },
    { id: 1051, name: "Water", color: "#232398", max: 100, amount: 0 },
  ];

  function getMacros(nutrient, grams) {
    let total = getNutrientById(nutrient, KCAL).amount;
    total = total * (grams / 100);
    let lastPercentage = 0;
    macros.forEach((macro) => {
      let amt = getNutrientById(nutrient, macro.id).amount;
      amt = amt * (grams / 100);
      if (amt) {
        macro.amount = amt;
      }
    });
  }

  $: getMacros(nutrient, grams);
  let myMacros = [];
  $: if (nutrient) {
    myMacros = macros.filter((m) => m.amount);
  }
</script>

<div>
  <div class="kcal" style={`width:${width}px;--height:${height}px`}>
    <svg {width}>
      {#each myMacros as macro, n}
        <rect
          x={0}
          y={n * (height / myMacros.length)}
          width={(width * macro.amount) / macro.max}
          height={height / myMacros.length}
          fill={macro.color}
        />
        <text
          x={width - 6}
          y={n * (height / myMacros.length) + height / (myMacros.length * 2)}
          fill="black"
          stroke="white"
          text-anchor="end"
          font-family="Futura"
          font-weight="bold"
        >
          {macro.name}
        </text>
      {/each}
    </svg>
    <div>{Math.round(kcal)}</div>
  </div>
</div>

<style>
  .kcal {
    display: flex;
    flex-direction: row;
    position: relative;
    height: var(--height);
    justify-content: center;
  }
  .kcal div {
    font-weight: bold;
    font-size: calc(var(--height) * 0.5);
    text-shadow: 1px 1px 1px white;
    color: #2227;
    text-align: center;
    align-self: center;
    z-index: 2;
  }
  .macro {
    overflow: hidden;
    border: 1px solid pink;
  }
  svg {
    height: var(--height);
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
