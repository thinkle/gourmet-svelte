import {parseAmount} from '../utils/numbers.js';
import {parseUnit} from '../utils/unitAmounts.js';
import {cleanupWhitespace} from '../utils/textUtils.js';
import {handleChunk} from './importer.js';
import {mergeIngredients} from '../utils/ingredientUtils.js';
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
    if (!chunk.text) {return context && context.localContext}
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
    if (!chunk.text) {return context.localContext}
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
    if (ing) {ingredients.push(ing)};
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
    if (!chunk.text && !chunk.children) {return context && context.localContext}
    // plain text-based handling, this is the simplest...
    debugger;
    let tempRec = {ingredients:[]}
    let textContext = {
        ...context,
        ingredients : []
    }    
    chunk.text && chunk.text.split('\n').forEach(
        function (line) {
            if (line.replace(/^\s+|\s+$/g)) {
                textContext.localContext = handleIngredient(line,textContext,tempRec);
            }
        }
    );
    let childrenContext = {
        ...context,
        ingredients : []
    }
    if (chunk.children) {
        // process children...
        for (let childId of chunk.children) {
            let childChunk = context.chunkMap[childId];
            if (childChunk) {
                if (childChunk && childChunk.text && childChunk.text.replace(/\s/g)==chunk.text.replace(/\s/g)) {
                    // Ignore total duplicate
                    childChunk.handled = true;
                } else {
                    handleChunk(childChunk,childrenContext,tempRec);
                }
            }
        }
    }

    // Now there are *three* spots our ingredients could be: our fake recipe (if we have a group or
    // something that would get pushed to the top level by our algorithm), or one of our two ingredient
    // lists. If we're double or triple tagged, we'll have to reconcile to remove duplicates...
    let newIngredients = mergeIngredientLists(
        [
            textContext.ingredients,
            childrenContext.ingredients,
            tempRec.ingredients
        ]
    );
    let ingredients = context.ingredients || recipe.ingredients;
    for (let i of newIngredients) {
        ingredients.push(i);
    }
    return context;
}

function mergeIngredientLists (lists) {
    if (lists.length==0) {
        return []
    } else if (lists.length==1) {
        return lists[0]
    } else {
        let outputList = [...lists[0]]
        for (let lst of lists.slice(1)) {
            outputList = mergeIntoList(outputList,lst);
        }
        return outputList
    }
}

function mergeIntoList (oldList, newList) {
    oldList = oldList.filter((i)=>i&&i.text)
    let mergedList = [...oldList]
    for (let item of newList) {
        let merged = false;
        if (!item.text) {
            // a lie, we're skipping this. It means we likely e.g. marked up
            // an amount on its own and ended up with a text-less ingredient
            // and no way to know who the amount belongs to, so we toss it
            merged = true
        } else {
            let text = item.text.replace(/\s/g,'')
            for (let oldItem of oldList) {
                let oldText = oldItem.text.replace(/\s/g,'');
                if (text.match(oldText) || oldText.match(text)) {
                    mergeIngredients(text,oldText);
                    merged = true;
                }
            }
        }
        if (!merged) {
            mergedList.push(item)
        }
    }
    return mergedList;
}


function handlePlainIngredient (chunk) {
    // fixme :)
    let text = chunk.text || chunk;
    if (!text) {return}
    let amount = parseAmount(text);
    if (amount.posttext && amount.pretext) {
        let main,extra,utext;
        if (amount.posttext.length > amount.pretext.length) {
            main = amount.posttext; extra = amount.pretext;
        }
        if (amount.posttext.length > amount.pretext.length) {
            extra = amount.posttext; main = amount.pretext;
        }
        if (!extra || extra.replace(/\W+/).length == 0) {
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
    if (!chunk.text) {return context && context.localContext}
    let ing = getIng(context,recipe,parent);
    ing.text = cleanupWhitespace(chunk.text);
    if (ing.amount && ing.amount.unit) {
        const replacer = new RegExp('^\\s*'+ing.amount.unit+'\\s+','gi');
        ing.text = ing.text.replace(replacer,'');
    }
    ing.text = cleanupWhitespace(ing.text);
    return undefined; // we don't propagate after the text
}
export function handleIngredientGroup (chunk, context, recipe) {
    if (!chunk.text) {return context && context.localContext}
    if (!context) {
        console.log('why no context???');
        debugger
    }
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
