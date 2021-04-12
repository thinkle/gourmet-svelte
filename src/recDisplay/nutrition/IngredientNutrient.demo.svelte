<script>
  import Ingredient from "../ing/IngredientEditor.svelte";
  import IngredientNutrientQuery from "./IngredientNutrientQuery.svelte";
  import IngredientGramWeight from "./IngredientGramWeight.svelte";
  import { standard } from "../../common/mocks/recipes";
  let ingredient = standard.ingredients[0].ingredients[0];
  //ingredient.text = 'grape tomatoes'
  let showi = false;
</script>

<IngredientGramWeight
  ing={ingredient}
  onSave={(i) => {
    console.log("gramWeight triggered change!", i);
    ingredient = i;
  }}
/>
{JSON.stringify(ingredient)}
<IngredientNutrientQuery bind:ing={ingredient} />
<pre>
  <button on:click={()=>{showi=!showi}}>ingredient</button>: {JSON.stringify(ingredient)}
  {#if showi && ingredient}
  <Ingredient 
    groups={[]} 
    ing={ingredient}
    onChange={(i)=>{ingredient = i}}
  />
  {/if}
</pre>
