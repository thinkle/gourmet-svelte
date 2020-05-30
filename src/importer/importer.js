import RecDef from '../common/RecDef.js'
import {parseAmount} from '../utils/numbers.js';
import {titleCase,cleanupWhitespace} from '../utils/textUtils.js';
import {handleIngredientAmount,handleIngredientUnit,handleIngredient,handleIngredientText,handleIngredientGroup,handleIngredients} from './ingredientImporter.js';
import {handleTime} from './timeImporter.js'
export function preprocessChunks (parsedChunks, context) {
    parsedChunks.sort(
        (a,b)=>{
            return (a.address>b.address&&1
                    ||
                    a.address<b.address&&-1
                    ||
                    0)
        }
    );
    parsedChunks = parsedChunks.map(
        (o)=>({...o})
    );
    findChildren(parsedChunks)
    context.chunkMap = {}
    parsedChunks.forEach(
        (chunk)=>context.chunkMap[chunk.id] = chunk
    );
    return parsedChunks
}

export function findChildren (parsedChunks) {
    // Given a sorted list of node addresses, find children...
    // Since we are sorted, children *must* come after the parents, so we will search backward
    // from the child until we find a parent
    //
    // 001
    // 001-002 (search back 1 node to find 001)
    // 001-002-003 (search back 1 node to find 001-002)
    // 001-004-006 (search back 2 nodes and fail, finally find 001 as a parent)
    // 002-003-004-006 (search back to failure -- no parent).
    if (parsedChunks.length==0) {return}
    parsedChunks[0].children = []
    for (let childIndex=1; childIndex < parsedChunks.length; childIndex++) {
        for (let parentIndex=childIndex-1; parentIndex > -1; parentIndex--) {
            parsedChunks[childIndex].children = []; // empty list
            // now we just check if the parent matches the start of the child...
            let childAddress = parsedChunks[childIndex].address
            let parentAddress = parsedChunks[parentIndex].address
            if (childAddress && parentAddress && childAddress.indexOf(parentAddress)==0) { // i.e. 001-002-003 matches 001-002
                parsedChunks[parentIndex].children.push(parsedChunks[childIndex].id)
                parentIndex = -1; // stop looping - we found our parent :)
            }
        }
    }
}

export function parseData (parseData) {
    let context = {...parseData.pageInfo}
    let chunks = Object.values(parseData);
    return parseChunks(chunks,context);
}

export function parseChunks (parsedChunks,context={}) {
    // We get an array of "parsed" chunks...
    const recipe = {
        ingredients : [],
        images : [],
    }


    // set up empty arrays
    for (let prop of RecDef.recProps) {
        if (prop.array) {
            recipe[prop.name] = [];
        }
    }
    parsedChunks = preprocessChunks(parsedChunks, context); // get map

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
    else if (chunk.tag=='category') {
        return handleCategory(chunk,context,recipe,parent)
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
    else if (chunk.tag=='ingredients') {
        return handleIngredients(chunk,context,recipe,parent);
    }
    else if (chunk.tag=='image') {
        return handleImage(chunk,context,recipe);
    }
}

function handleCategory (chunk, context, recipe) {
    if (!recipe.categories) {
        recipe.categories = [];
    }
    recipe.categories.push(
        {name:cleanupWhitespace(chunk.text)}
    );
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

function handleImage (chunk, context, recipe) {
    let img = getElement(chunk,{selector:'img',baseUrl:context.url});
    if (img) {
        recipe.images.push({url:img.src,
                            alt:img.alt,
                           })
    }
}

function handleSource (chunk, context, recipe) {
    let name = cleanupWhitespace(chunk.text)
    let url = getUrl(chunk,{baseUrl:context.url})
    if (!url) {
        [name,url] = extractUrlFromText(name)
    }
    if (context &&
        context.url) {
        let urlObject = new URL(url,context.url)
        url = urlObject.href
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
    if (chunk.children && chunk.children.length) {
        for (let childId of chunk.children) {
            let child = context.chunkMap[childId]
            if (child.tag=='text') {
                // don't bother with nested text children -- we'll just let the parent handle it
                child.handled = true;
            }
            // FIXME : Add header handling?
        }
    }
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

function getElement (chunk, {selector, baseUrl}={}) {
    let doc = new DOMParser().parseFromString(addBaseUrl(chunk.html,baseUrl),'text/html');
    let candidates = doc.querySelectorAll(selector);
    if (candidates.length > 1) {
        console.log('Warning: found more than one match for ',selector,'in',chunk);
    }
    if (candidates.length>0) {
        return candidates[0]
    }

    function addBaseUrl (text,url) {
        return `<head><base href=${url}></head>${text}`
    }
}

function getUrl (chunk, {selector='a[href]', attr='href', baseUrl=''}={}) {
    // adding base url to parser fails... we'll just remove our URL I guess
    let link = getElement(chunk,{selector,baseUrl})
    if (link) {
        return link[attr]
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
                {name:context.host,
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
        if (!url.match(/\/\//)) {
            url = '//' + url
        }
        return [text,url]
    }
    else {
        return [text,undefined]
    }
}

