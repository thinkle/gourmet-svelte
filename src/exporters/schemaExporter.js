function convert (recipe) {
    let json = {
        '@type':'Recipe',
    }
    let cuisines = recipe.categories.filter((c)=>c.type=='cuisine').map((c)=>c.name)
    let cats =  recipe.categories.filter((c)=>c.type!='cuisine').map((c)=>c.name)
    if (cats) {
        json.recipeCategory = cats
    }
    if (cuisines) {
        json.recipeCuisine = cuisines
    }
    if (recipe.yields && recipe.yields.length > 0) {
        json.recipeYield = recipe.yields.map(
            (y)=>`${y.amount} ${y.unit}`
        )
    }
    if (recipe.images) {
        json.image = recipe.images[0]
        if (recipe.images.length > 1) {
            json.images = recipe.images
        }
    }
    json.recipeIngredient = convertIngredients(recipe.ingredients)
    json.author = recipe.sources;
    json.times = recipe.times
    for (let [prop,match] of [
        ['prepTime',/prep/i],
        ['cookTime',/cook/i],
        ['totalTime',/total/i]
    ]) {
        let time = recipe.times.find((t)=>t.name.match(match));
        if (time) {
            json[prop] = 'PS'+time.seconds
        }
    }
    json.identifier = recipe._id || recipe.id;
    json.name = recipe.title
    json.recipeInstructions = recipe.text.map(
        (text)=>text.header&&`${text.header||''}\n\n${text.body}`||text.body
    );
    return json
}


export function convertIngredients (ingredients) {
    let out = [];
    for (let i of ingredients) {
        if (i.ingredients) {
            out = [...out,...convertIngredients(i.ingredients)]
        } else {
            if (i.amount) {
                out.push(`${i.amount.amount||''} ${i.amount.unit||''} ${i.text}`);
            } else {
                out.push(i.text);
            }
        }
    }
    return out;
}


export default {
    type : 'jsonld',
    label : 'Schema.org JSON-LD',
    extension : 'json',
    convert
}
