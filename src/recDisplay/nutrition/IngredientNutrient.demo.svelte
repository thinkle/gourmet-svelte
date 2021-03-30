<script>
  import IngredientNutrient from './IngredientNutrient.svelte';
  import IngredientGramWeight from './IngredientGramWeight.svelte';
  import {standard} from '../../common/mocks/recipes'
  let ingredient = standard.ingredients[0].ingredients[0];
  //ingredient.text = 'grape tomatoes'
</script>

<IngredientGramWeight 
  ing={ingredient}
  onChange={(i)=>ingredient=i}>
</IngredientGramWeight>
<IngredientNutrient bind:ing={ingredient}/>
<pre>
  ingredient: {JSON.stringify(ingredient)}

</pre>