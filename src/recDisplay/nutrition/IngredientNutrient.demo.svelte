<script>
  import IngredientNutrient from './IngredientNutrient.svelte';
  import IngredientGramWeight from './IngredientGramWeight.svelte';
  import {standard} from '../../common/mocks/recipes'
  let ingredient = standard.ingredients[0].ingredients[0];
</script>

<IngredientGramWeight bind:ing={ingredient}/>
<IngredientNutrient bind:ing={ingredient}/>
<pre>
  ingredient: {JSON.stringify(ingredient)}

</pre>