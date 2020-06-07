import {testRecs} from  '../common/mocks/recipes.js'
let items = []
let multipliers = [0.5,undefined,2,1];
let n = 0;

for (let key of Object.keys(testRecs)) {
    let multiplier = multipliers[n % multipliers.length]
    n += 1;
    let recipe = testRecs[key];
    if (recipe.ingredients) {
        crawlIngredients(recipe.ingredients,recipe,multiplier);
    }
}

function crawlIngredients (ii, source, multiplier) {
    ii.forEach(
        (i)=>{
            if (i.ingredients) {
                crawlIngredients(i.ingredients,source,multiplier)
            } else if (!i.reference) {
                items.push({ingredient:i,source,multiplier})
            }
        }
    );
}

export default items
