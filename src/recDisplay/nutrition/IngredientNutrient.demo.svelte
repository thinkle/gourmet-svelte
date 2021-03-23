<script>
  import IngredientNutrient from './IngredientNutrient.svelte';
  import {standard} from '../../common/mocks/recipes'
  let ingredient = standard.ingredients[0].ingredients[0];
</script>


<IngredientNutrient ing={ingredient}/>
<pre>
  {JSON.stringify(ingredient)}

</pre>