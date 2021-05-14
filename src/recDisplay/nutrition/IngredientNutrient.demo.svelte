<script>
  import Ingredient from "../ing/IngredientEditor.svelte";
  import IngredientNutrition from "./IngredientNutrition.svelte";
  import IngredientNutrientQuery from "./IngredientNutrientQuery.svelte";
  import IngredientGramWeight from "./IngredientGramWeight.svelte";
  import { standard } from "../../common/mocks/recipes";
  let n = 5;
  let m = 1;
  let ingredient = standard.ingredients[m].ingredients[n];
  function updateIngredient() {
    ingredient = standard.ingredients[m].ingredients[n];
  }
  $: updateIngredient(m, n);

  //ingredient.text = 'grape tomatoes'
  let showi = false;
</script>

Ing: <input
  bind:value={n}
  min={0}
  max={standard.ingredients[m].ingredients.length}
  step={1}
/>
Group :
<input bind:value={m} min={0} max={standard.ingredients.length} step={1} />
<br />
<br />
{#key m}
  {#key n}
    <IngredientNutrition
      ing={ingredient}
      onChange={(i) => {
        console.log("Got new ingredient info", i);
        ingredient = i;
      }}
    />
  {/key}
{/key}
