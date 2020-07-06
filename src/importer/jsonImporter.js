import {handleChunk} from './importer.js';

export function handleLDJson (chunk,context,recipe) {
    try {
        var json = JSON.parse(chunk.fullText);
    } catch (err) {
        console.log('invalid json:',chunk.fullText);
        return
    }
    if (Array.isArray(json)) {
        json.map((o)=>handleLDObj(o,context,recipe))
    } else {
        handleLDObj(json,context,recipe);
    }
}

function handleLDObj (json, context) {
    // We are basically a complete importer on our own, so we actually make a completely
    // new import for our context.... we will let the importer merge all the separate
    // imports at the end...
    if (!context.separateImports) {
        context.separateImports = []
    }
    const recipe = {
        images : [],
        sources : [],
        yields : [],
        categories : [],
        text : [],
        times : [],
        ingredients : [],
    }
    context.separateImports.push(recipe)
    if (json['@type'] == 'Recipe') {
        if (json.name) {recipe.title = json.name}
        if (json.url) {
            recipe.sources.push({url:json.url})
        }
        if (json.author) {
            if (Array.isArray(json.author)) {
                recipe.sources = [...recipe.sources,...json.author]
            } else if (typeof json.author === 'string') {
                recipe.sources = [...recipe.sources,{name:json.author}]
            } else if (typeof json.author === 'object' && json.author.name) {
                recipe.sources.push(json.author)
            } else {
                console.log('WARNING: UNRECOGNIZED JSON AUTHOR ',json.author);
            }
        }
        if (json.recipeCuisine) {
            recipe.categories = [...recipe.categories,{name:json.recipeCuisine,type:'cuisine'}]
        }
        if (json.recipeCategory) {
            recipe.categories = [...recipe.categories,{name:json.recipeCategory}]
        }
        if (json.recipeYield) {
            handleChunk(
                {text:json.recipeYield,
                 tag:'yields'},
                context,recipe
            )
        }
        // times
        for (let [prop,name] of [['cookTime','Cooking Time'],
                                 ['totalTime','Total Time'],
                                 ['prepTime','Preparation Time']
                                ]) {
            if (json[prop]) {
                if (json[prop][0]=='P') {
                    handleChunk(
                        {text:' ',iso8601:json[prop],
                         detail:name,
                         tag:'time'},
                        context,
                        recipe
                    )
                } else {
                    handleChunk(
                        {tag:'time',
                         text:json[prop],
                         detail:name},
                        context,
                        recipe
                    )
                }
            }
        }
        if (json.recipeInstructions) {
            if (Array.isArray(json.recipeInstructions)) {
                json.recipeInstructions.map(
                    ({text})=>{
                        handleChunk(
                            {text,
                             tag:'text'},
                            context,
                            recipe
                        );
                    }
                );
            }
        }
        if (json.recipeIngredient) {
            if (Array.isArray(json.recipeIngredient)) {
                json.recipeIngredient.map(
                    (i)=>handleChunk({text:i,tag:'ingredient'},
                                     context,
                                     recipe)
                )
            }
        }
        if (json.image) {
            if (json.image.url) {
                recipe.images = [...recipe.images,json.image]
            }
            else if (typeof json.image=='string') {
                recipe.images = [...recipe.images,{url:json.image}]
            }

        }
    }
    return context
}
