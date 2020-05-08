// Validate and prepare our recipe for insertion...
// This may do DB-specific things to the recipe to make life easier...

function validateRec (rec) {
    rec.flatIngredients = []
    rec.ingredients.map((i)=>crawlIngredient(i,rec.flatIngredients))
    rec.fullText = getFullText(rec)
}

function getFullText (rec) {
    let texts = [];
    texts.push(rec.title||'')
    rec.text.forEach(
        (text)=>texts.push(removeMarkup(text.body))
    );
    rec.flatIngredients.forEach(
        (ing)=>texts.push(ing.text||'')
    );
    rec.sources.forEach(
        (source)=>texts.push(source.name||'')
    );
    rec.categories.forEach(
        (cat)=>texts.push(cat.name)
    );
    return texts.join(' ');
}

function removeMarkup (txt) {
    return txt.replace(/(<([^>]+)>)/ig,"");
}

function crawlIngredient (ingredient, array) {
    if (ingredient.ingredients) {
        ingredient.ingredients.map((i)=>crawlIngredient(i,array))
    }
    else {
        array.push(ingredient)
    }
}

/**
For preparing a recipe collection that's been exported for import...
**/
export function prepRecs (recs,user) {

    const salt = new Date().getTime().toString(36)

    function makeId (id) {
        return `${recs.metadata.name}-${id}-${salt}`
    }

    recs.recipes.forEach(
        (r)=>{
            r.owner = user;
            r._id = makeId(r.localid);
            crawlIngsForIds(r.ingredients);
            validateRec(r)
        }
    );

    function crawlIngsForIds (ii) {
        ii.forEach(
            (i) => {
                if (i.reference) {
                    i.reference = makeId(i.reference);
                }
            }
        );
    }
}


export {validateRec}

