<script>

  export let ing;
  import {getNutritionQuery,extractItems} from '../../utils/ingredientUtils';
  import {queryNutrientRequest, getNutrientInfoRequest} from '../../data/requests/'
  import {user} from '../../stores/userStore'


  async function getInfo (ing) {
    nutrients = food.foodNutrients; // while we search...
    portion = {}
    nutritionInfo = food;
    if (!food?.fdcId) {return}
    let response = await getNutrientInfoRequest.makeRequest(
      {user:$user,
        params: {id:`${food.fdcId}`}
      }
    );
    if (response) {
      nutritionInfo = response?.result
      console.log('Got info:',nutritionInfo)
      if (nutritionInfo?.foodPortions?.length) {
        portion = nutritionInfo.foodPortions[0];
      }
      if (nutritionInfo?.foodNutrients) {
        console.log('new nutrients')
        nutrients = nutritionInfo.foodNutrients;
      }
    }
  }
</script>

<div>

</div>
