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
            if (typeof json.recipeCuisine == 'string') {
                recipe.categories = [...recipe.categories,{name:json.recipeCuisine,type:'cuisine'}]
            }
            else if (Array.isArray(json.recipeCuisine)) {
                recipe.categories = [...recipe.categories,
                                     ...json.recipeCuisine
                                     .filter((v)=>typeof v=='string')
                                     .map((v)=>({name:v,type:'cuisine'}))
                                    ];
            }
        }
        if (json.recipeCategory) {
            if (typeof json.recipeCategory == 'string') {
                recipe.categories = [...recipe.categories,{name:json.recipeCategory}]
            }
            else if (Array.isArray(json.recipeCategory)) {
                recipe.categories = [...recipe.categories,
                                     ...json.recipeCategory
                                     .filter((v)=>typeof v=='string')
                                     .map((v)=>({name:v}))
                                    ];
            }
        }
        if (json.recipeYield) {
            if (typeof json.recipeYield=='string') {
                handleChunk(
                    {text:json.recipeYield,
                     tag:'yields'},
                    context,recipe
                );
            } else if (Array.isArray(json.recipeYield)) {
                json.recipeYield.forEach(
                    (y)=>{
                        if (typeof y=='string') {
                            handleChunk(
                                {text:json.recipeYield,
                                 tag:'yields'},
                                context,recipe
                            );
                        }
                    }
                );
            }
        }
        // times
        for (let [prop,name] of [['cookTime','Cooking Time'],
                                 ['totalTime','Total Time'],
                                 ['prepTime','Preparation Time']
                                ]) {
            if (json[prop] && typeof json[prop] == 'string') {
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
            } else if (typeof json.recipeInstructions == 'string') {
                handleChunk(
                    {text:json.recipeInstructions,
                     tag:'text'},
                    context,
                    recipe
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
