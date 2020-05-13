// Validate and prepare our recipe for insertion...
// This may do DB-specific things to the recipe to make life easier...
import stopword from 'stopword';

function validateRec (rec) {
    rec.flatIngredients = []
    rec.ingredients.map((i)=>crawlIngredient(i,rec.flatIngredients))
    rec.fullText = getFullText(rec)
}

function getFullText (rec) {
    let texts = [];
    texts.push(rec.title||'')
    rec.text && rec.text.forEach(
        (text)=>texts.push(removeMarkup(text.body))
    );
    rec.flatIngredients.forEach(
        (ing)=>texts.push(ing.text||'')
    );
    rec.sources && rec.sources.forEach(
        (source)=>texts.push(source.name||'')
    );
    rec.categories && rec.categories.forEach(
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
            r.owner = {
                email : user.email,
                full_name : user.metadata && user.metadata.full_name
            };
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
let commonWords = ['the','and','but','for']

export function prepRecLocal (rec) {
    validateRec(rec); // step 1...
    rec.words = [];
    rec.fullText.split(/\W+/).forEach(
        (w)=>{
            w = w.toLowerCase();
            if (!commonWords.indexOf(w)>-1 &&
                rec.words.indexOf(w)==-1) {
                rec.words.push(w)
            }
        }
    );
    delete rec.fullText; // we don't need to keep this.
    rec.words = stopword.removeStopwords(rec.words);
    rec.ings = []
    rec.flatIngredients.forEach(
        (i)=>{
            if (i.text) {rec.ings.push(i.text.toLowerCase());}
            if (i.ingkey) {
                rec.ings.push(i.ingkey.toLowerCase());
            }
            if (i.text.split().length > 1) {
                rec.ings = [...rec.ings,...i.text.split()];
            }
        });
    rec.ings = stopword.removeStopwords(rec.words);
    delete rec.flatIngredients // not keeping this either
    return rec;
}

export {validateRec}

