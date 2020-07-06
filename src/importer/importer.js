import RecDef from '../common/RecDef.js'
import {parseAmount} from '../utils/numbers.js';
import {titleCase,cleanupWhitespace} from '../utils/textUtils.js';
import {handleIngredientAmount,handleIngredientUnit,handleIngredient,handleIngredientText,handleIngredientGroup,handleIngredients} from './ingredientImporter.js';
import {handleLDJson} from './jsonImporter.js'
import {handleTime} from './timeImporter.js'
import deepcopy from 'deepcopy';
import sanitizeHtml from 'sanitize-html';

export function preprocessChunks (parsedChunks, context) {
    // Remove any duplicates...
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
    let uniqueOnly = [];
    for (let chunk of parsedChunks) {
        if (uniqueOnly.length==0) {uniqueOnly.push(chunk)}
        else if (uniqueOnly[uniqueOnly.length-1].address != chunk.address) {
            uniqueOnly.push(chunk)
        } else {
            console.log('IGNORING DUPLICATE CHUNK',chunk,'duplicates',uniqueOnly[uniqueOnly.length-1]);
        }
    }
    parsedChunks = uniqueOnly;
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
    let recipe = {
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
    if (context.separateImports) {
        let originalRecipe = deepcopy(recipe);
        recipe = mergeRecipes([recipe,...context.separateImports]);
        recipe.alternatives = [deepcopy(recipe),originalRecipe,...context.separateImports]
    }
    recipe.ingredients = removeEmptyIngredients(recipe.ingredients);
    addSourceIfMissing(recipe,context);
    return recipe
}

function mergeRecipes (recipes) {
    // pretty low-tech here...
    if (recipes.length==1) {
        return recipes[0];
    } else {
        let rec = recipes.shift()
        while (recipes.length>0) {
            let next = recipes.shift();
            if (next) {
                rec = mergeOne(rec,next)
            }
        }
        return rec;
    }
}

function mergeOne (orig, other) {
    for (let {name} of RecDef.titleProps) {
        if (!orig[name] && other[name]) {
            orig[name] = other[name];
        }
    }
    for (let {name,array,match} of RecDef.recProps) {
        if (other[name]) {
            if (!orig[name]) {
                orig[name] = other[name];
            }
            else if (array) {
                orig[name] = mergeArrayVals(
                    orig[name],other[name],match
                )
            }
        }
    }
    orig.ingredients = mergeIngredients(orig.ingredients,
                                        other.ingredients);
    return orig
}

function mergeIngredients (ii1, ii2) {
    ii1 = removeEmptyIngredients(ii1)
    ii2 = removeEmptyIngredients(ii2)
    console.log('MERGE OPTION 1',ii1)
    console.log('MERGE OPTION 2',ii2)
    // FIXME
    // Doing this properly is really a pain... so we'll do it
    // simply for now...
    if (!ii1 || ii1.length==0) {return ii2}
    if (!ii2 || ii2.length==0) {return ii1}
    // Ok -- if we have a conflict... let's take the one that has groups...
    if (ii1.filter((i)=>i.ingredients&&i.ingredients.length).length) {
        return ii1
    }
    if (ii2.filter((i)=>i.ingredients&&i.ingredients.length).length) {
        return ii2
    }
    // If neither has groups, let's take the longest...
    let i1amounts = ii1.filter((i)=>i.amount&&i.amount.amount).length 
    let i2amounts = ii2.filter((i)=>i.amount&&i.amount.amount).length
    if (i1amounts > i2amounts) {
        return ii1;
    } else if (i2amounts > i1amounts) {
        return ii2;
    }
    if (ii1.length >= ii2.length) {
        return ii1
    } else {
        return ii2
    }
}

function mergeArrayVals (a1, a2, matcher) {
    for (let v2 of a2) {
        let match = a1.find((v1)=>matcher(v2,v1));
        if (match) {
            Object.assign(
                match,
                v2,
                match // original values take precedence in a conflict...
            )
        } else {
            a1.push(v2);
        }
    }
    return a1;
}

function removeEmptyIngredients (ingredients) {
    return ingredients.filter((i,n)=>{
        if (i.ingredients && i.ingredients.length > 0) {
            i.ingredients = removeEmptyIngredients(i.ingredients);
            return true
        } else if (!i.text || i.text.match(/^\s*(Ingredients)?\s*$/i)) {
            return false;
        } else {
            return true
        }
    });
    
}


export function handleChunk (chunk, context, recipe, parent) {
    if (chunk.handled) {
        return;
    }
    else {
        chunk.handled = true; // only run once per chunk
    }
    if (chunk.tag=='ld+json') {
        handleLDJson(chunk,context,recipe)
    }
    if (!chunk.text && !chunk.html) {
        console.log('Weird, empty chunk? IGNORING',chunk);
        return context.localContext; // no change - reject
    }
    if (chunk.tag=='ignore') {
        ignoreMatchingDescendants(chunk,context,{ignoreAllTags:true});
        chunk.handled = true;
        return {}
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

function getTextFromChunk (chunk,context) {
    let text = chunk.text;
    if (chunk.children) {
        chunk.children.forEach(
            (child)=>{
                if (context.chunkMap[child]) {
                    let ch = context.chunkMap[child]
                    if (ch.tag=='ignore') {
                        text = text.replace(ch.text,'');
                    }
                }
            }
        );
    }
    return text;
    
}

export function ignoreMatchingDescendants (chunk,context,{extraTagsToIgnore,ignoreAllTags}={}) {
    if (!chunk) {return}
    if (!chunk.tag) {return}
    if (chunk.children) {
        chunk.children.forEach(
            (child)=>{
                if (context.chunkMap[child]) {
                    let ch = context.chunkMap[child]
                    if (ignoreAllTags || ch.tag==chunk.tag || extraTagsToIgnore && extraTagsToIgnore.includes(ch.tag)) {
                        ch.handled = true;
                        ignoreMatchingDescendants(ch,context,{extraTagsToIgnore,ignoreAllTags}); // recursive!
                    }
                }
            }
        );
    }
}

function handleCategory (chunk, context, recipe) {
    ignoreMatchingDescendants(chunk,context);
    if (!chunk.text) {return context && context.localContext}
    if (!recipe.categories) {
        recipe.categories = [];
    }
    recipe.categories.push(
        {name:cleanupWhitespace(chunk.text)}
    );
}

function handleYields (chunk, context, recipe) {
    ignoreMatchingDescendants(chunk,context);
    if (!chunk.text) {return context && context.localContext}
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
    ignoreMatchingDescendants(chunk,context);
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
    ignoreMatchingDescendants(chunk,context);
    let header
    if (chunk.detail) {
        header = chunk.detail
    } else {
        header = getHeader(chunk); // may modify HTML
    }
    if (chunk.html) {
        recipe.text.push({
            body:sanitizeHtml(chunk.html,
                              {allowedIframeHostnames: ['www.youtube.com', 'player.vimeo.com']}
                             ),
            header
        });
    } else {
        recipe.text.push({
            body:chunk.text,
            header:''
        }
                        );
    }
}

function handleTitle (chunk, context, recipe) {
    ignoreMatchingDescendants(chunk,context);
    if (!chunk.text) {return context && context.localContext}
    let title = cleanupWhitespace(getTextFromChunk (chunk,context)) //chunk.text)
    if (!recipe.title) {
        recipe.title = title;
    }
    else {
        recipe.title += ' '+title;
    }
}

function getHeader (chunk,recipe) {
    let el = getElement(chunk,{selector:'h1,h2,h3,h4,h5,h6'});
    let header = el && el.textContent || ''
    if (header) {
        chunk.html = chunk.html.replace(el.outerHTML,'');
    }
    return header
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
            if (source.url && source.url.replace(/https?:/,'')==baseContext) {
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
    let liberalUrlMatcher = /([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&\/\/=]*))/;
    let m = text.match(liberalUrlMatcher);
    if (m) {
        let url = m[0]
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

