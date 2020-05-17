import RecDef from '../common/RecDef.js'
import {parseAmount} from '../utils/numbers.js';
import {titleCase,cleanupWhitespace} from '../utils/textUtils.js';
import Times from '../utils/times.js';
import {handleIngredientAmount,handleIngredientUnit,handleIngredient,handleIngredientText,handleIngredientGroup} from './ingredientImporter.js';

export function preprocessChunks (parsedChunks, context) {
    // since we're already iterating through the list, we'll make a
    // map while we're there
    context.chunkMap = {}
    parsedChunks.sort(
        (a,b)=>{
            context.chunkMap[a.id] = a;
            context.chunkMap[b.id] = b;
            return (a.address>b.address&&1
                    ||
                    a.address<b.address&&-1
                    ||
                    0)
        }
    );
}

export function parseChunks (parsedChunks,context={}) {
    // We get an array of "parsed" chunks...
    const recipe = {
        ingredients : []
    }


    // set up empty arrays
    for (let prop of RecDef.recProps) {
        if (prop.array) {
            recipe[prop.name] = [];
        }
    }

    preprocessChunks(parsedChunks, context); // get map

    for (let chunk of parsedChunks) {
        context.localContext = handleChunk(chunk,context,recipe);
    }
    addSourceIfMissing(recipe,context);

    return recipe
}


export function handleChunk (chunk, context, recipe, parent) {
    if (chunk.handled) {
        return;
    }
    else {
        chunk.handled = true; // only run once per chunk
    }
    if (chunk.tag=='title') {
        return handleTitle(chunk,context,recipe);
    }
    else if (chunk.tag=='source') {
        return handleSource(chunk,context,recipe,parent)
    }
    else if (chunk.tag=='time') {
        return handleTime(chunk,context,recipe,parent)
    }
    else if (chunk.tag=='yields') {
        return handleYields(chunk,context,recipe)
    }
    else if (chunk.tag=='text') {
        return handleText(chunk,context,recipe)
    }
    else if (chunk.tag=='amount') {
        return handleIngredientAmount(chunk,context,recipe,parent)
    }
    else if (chunk.tag=='unit') {
        return handleIngredientUnit(chunk,context,recipe,parent)
    }
    else if (chunk.tag=='ingredient') {
        return handleIngredient(chunk,context,recipe,parent)
    }
    else if (chunk.tag=='ingredientText') {
        return handleIngredientText(chunk,context,recipe,parent)
    }
    else if (chunk.tag=='inggroup') {
        return handleIngredientGroup(chunk,context,recipe,parent);
    }
}

function handleTime (chunk, context, recipe) {
    let amount = parseAmount(chunk.text);
    amount.unit = Times.getTimeUnit(chunk.text);
    amount.seconds = amount.amount * amount.unit;
    if (amount.pretext) {
        amount.label = titleCase(cleanupWhitespace(amount.pretext))
    }
    else {
        amount.label = 'Time'
    }
    amount.text = cleanupWhitespace(chunk.text)
    recipe.times.push(amount);
}

function handleYields (chunk, context, recipe) {
    let amount = parseAmount(chunk.text);
    if (amount.pretext && amount.posttext) {
        cleanupWhitespace(amount.pretext +' '+amount.posttext)
    }
    else {
        amount.unit = cleanupWhitespace(amount.pretext || amount.posttext)
    }
    recipe.yields.push(amount);
}

function handleSource (chunk, context, recipe) {
    let name = cleanupWhitespace(chunk.text)
    let url = getUrl(chunk)
    if (!url) {
        [name,url] = extractUrlFromText(name)
    }
    if (context &&
        context.url) {
        console.log('Update with ',context.url)
        let urlObject = new URL(url,context.url)
        url = urlObject.href
        console.log('Got',url)
    }
    let source = {name,url}
    recipe.sources.push(source)
    return {
        tag:'source',
        property:'source',
        value:source
    }
}

function handleText (chunk, context, recipe) {
    recipe.text.push({
        body:chunk.html,
        header:chunk.detail||getHeader(chunk,recipe),
    });
}

function handleTitle (chunk, context, recipe) {
    let title = cleanupWhitespace(chunk.text)
    if (!recipe.title) {
        recipe.title = title;
    }
    else {
        recipe.title += ' '+title;
    }
}

function getHeader (chunk,recipe) {
    // implement?
    if (recipe.text.length) {
        return ''
    }
    else {
        return 'Instructions'
    }
}

function getUrl (chunk, selector='a[href]', attr='href') {
    let doc = new DOMParser().parseFromString(chunk.html,'text/html');
    let candidates = doc.querySelectorAll(selector);
    if (candidates.length == 1) {
        return candidates[0][attr]
    }
}

function addSourceIfMissing (recipe, context) {
    if (context.url) {
        let alreadyHaveUrl = false;
        let baseContext = context.url.replace(/https?:/,'')
        for (let source of recipe.sources) {
            if (source.url.replace(/https?:/,'')==baseContext) {
                alreadyHaveUrl = true;
            }
        }
        if (!alreadyHaveUrl) {
            recipe.sources.push(
                {name:recipe.title,
                 url:context.url}
            )
        }
    }
}



function extractUrlFromText (text) {
    let liberalUrlMatcher = /(?<url>[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*))/;
    let m = text.match(liberalUrlMatcher);
    if (m) {
        let url = m.groups.url
        text = text.replace(liberalUrlMatcher,'')
        text = text.replace(/^\s*(\W+\s*)+/,'')
        text = text.replace(/\s*(\W+\s*)+$/,'')
        console.log('Have text and url',text,url)
        if (!url.match(/\/\//)) {
            console.log('Add slashes...')
            url = '//' + url
        }
        return [text,url]
    }
    else {
        return [text,undefined]
    }
}

