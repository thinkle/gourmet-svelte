import {parseAmount} from '../utils/numbers.js';
import {parseUnit} from '../utils/unitAmounts.js';
import {cleanupWhitespace} from '../utils/textUtils.js';
import {handleChunk} from './importer.js';

function getIng (context, recipe, parent) {
    let ing
    
    if (parent) {
        ing = parent
    }
    else {
        if (context.localContext && context.localContext.tag=='ingredient') {
            ing = context.localContext.value
        }
    }
    if (!ing) {
        ing = {}
        if (context.ingredients) {
            context.ingredients.push(ing);
        }
        else {
            recipe.ingredients.push(ing);
        }
    }
    return ing;
}

export function handleIngredientAmount (chunk, context, recipe, parent) {
    let ing = getIng(context,recipe,parent);
    let amount  = parseAmount(chunk.text);
    if (!ing.amount) {
        ing.amount = {}
    }
    ing.amount = {...ing.amount,amount:amount.amount,rangeAmount:amount.rangeAmount}
    if (!ing.amount.unit && (amount.posttext)) {
        ing.amount.unit = cleanupWhitespace(amount.posttext)
    }
    return {
        tag : 'ingredient',
        value : ing,
    }
}

export function handleIngredientUnit (chunk, context, recipe, parent) {
    let ing = getIng(context,recipe,parent);
    if (!ing.amount) {
        ing.amount = {}
    }
    ing.amount.unit = cleanupWhitespace(chunk.text);
    return {
        tag : 'ingredient',
        value : ing,
    }

}
export function handleIngredient (chunk, context, recipe) {
    // always start a fresh ingredient for the ingredient tag.
    // Begin with plain text parsing...
    let ing = handlePlainIngredient(chunk)
    let ingredients = context.ingredients || recipe.ingredients;
    ingredients.push(ing);
    // Now override plain text parsing if need be...
    if (chunk.children && chunk.children.length > 0) {
        for (let childID of chunk.children) {
            let childChunk = context.chunkMap[childID]
            if (childChunk) {
                handleChunk(childChunk,context,recipe,ing);
            }
            else {
                // warn?
                console.log('Warning: ingredient claims to have child ID',childID,'that is not found in',context.chunkMap);
            }
        }
        // Now handle the remaining ingredient
    }
    return {} // no context -- we are are complete in ourselves... 
}

export function handleIngredients (chunk, context, recipe) {
    chunk.text.split('\n').forEach(
        function (line) {
            if (line.replace(/^\s+|\s+$/g)) {
                context = handleIngredient(line,context,recipe);
            }
        }
    );
    return context;
}


function handlePlainIngredient (chunk) {
    // fixme :)
    let text = chunk.text || chunk;
    let amount = parseAmount(text);
    console.log('Got amount',amount)
    if (amount.posttext && amount.pretext) {
        let main,extra,utext;
        if (amount.posttext.length > amount.pretext.length) {
            main = amount.posttext; extra = amount.pretext;
        }
        if (amount.posttext.length > amount.pretext.length) {
            extra = amount.posttext; main = amount.pretext;
        }
        if (extra.replace(/\W+/).length == 0) {
            utext = main;
        } else {
            utext = main + ' - ' + extra;
        }
    }
    let unitAndText = parseUnit(amount.posttext||amount.pretext);

    delete amount.posttext;
    delete amount.pretext;
    amount.unit = unitAndText.unit
    amount.standardUnit = unitAndText.standardUnit
    return {
        originalText:text,
        amount,
        text:unitAndText.text,
    }
}

export function handleIngredientText (chunk, context, recipe, parent) {
    let ing = getIng(context,recipe,parent);
    ing.text = cleanupWhitespace(chunk.text);
    if (ing.amount.unit) {
        const replacer = new RegExp('^\\s*'+ing.amount.unit+'\\s+','gi');
        ing.text = ing.text.replace(replacer,'');
    }
    ing.text = cleanupWhitespace(ing.text);
    return undefined; // we don't propagate after the text
}
export function handleIngredientGroup (chunk, context, recipe) {
    let groupname = cleanupWhitespace(chunk.text);
    let ing = {text:groupname,ingredients:[]}
    recipe.ingredients.push(ing);
    context.ingredients = ing.ingredients;
    context.localContext = {}
    if (chunk.children) {
        for (let childID of chunk.children) {
            let childChunk = context.chunkMap[childID];
            if (childChunk) {
                context.localContext = handleChunk(childChunk,context,recipe);
            }
        }
        delete context.ingredients
    }
    // if we don't mark children, then ingredient groups are understood to
    // be headers containing everything after them... :(
}
