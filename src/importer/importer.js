import RecDef from '../common/RecDef.js'
import {parse_amount} from '../utils/Numbers.js';
import Times from '../utils/Times.js';

export function sortChunks (parsedChunks) {
    parsedChunks.sort(
        (a,b)=>(a.address>b.address&&1
                ||
                a.address<b.address&&-1
                ||
                0)
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
    
    sortChunks(parsedChunks)
    for (let chunk of parsedChunks) {
        context.localContext = handleChunk(chunk,context,recipe);
    }
    addSourceIfMissing(recipe,context);

    return recipe
}


export function handleChunk (chunk, context, recipe) {
    if (chunk.tag=='title') {
        return handleTitle(chunk,context,recipe);
    }
    else if (chunk.tag=='source') {
        return handleSource(chunk,context,recipe)
    }
    else if (chunk.tag=='times') {
        return handleTime(chunk,context,recipe)
    }
    else if (chunk.tag=='yields') {
        return handleYields(chunk,context,recipe)
    }
}

function handleTime (chunk, context, recipe) {
    let amount = parse_amount(chunk.text);
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
    let amount = parse_amount(chunk.text);
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

function handleTitle (chunk, context, recipe) {
    let title = cleanupWhitespace(chunk.text)
    if (!recipe.title) {
        recipe.title = title;
    }
    else {
        recipe.title += ' '+title;
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

function cleanupWhitespace (text, condenseMiddleSpaces=true) {
    text = text
        .replace(/^\s*/,'') // leading whitespace
        .replace(/\s*$/,'') // trailing whitespace
    if (condenseMiddleSpaces) {
        return text
            .replace(/\s+/g,' ') // extra whitespace -> single
    }
    else {
        return text
    }
}

function titleCase (words) {
    return words.split(/\s/).map(
        (word)=>word[0].toUpperCase()+word.substr(1).toLowerCase()
    ).join(' ')
}
