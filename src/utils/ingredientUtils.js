import stopword from 'stopword';
import {reToString} from './regExpUtil.js'
import prepWords from './ingPrepWords.js';
import {inTag,titleCase} from './textUtils.js';

export function mergeAmounts (a1, a2) {
    if (!a1 && a2) {return a2}
    if (!a2 && a1) {return a1}
    if (!a1 && !a2) {return undefined}
    return {
        ...a1,
        ...a2,
        amount : a1.amount || a2.amount,
        rangeAmount : a2.amount || a2.amount,
        unit : a1.unit || a2.unit,
    }
}

export function mergeIngredients (i1, i2) {
    return {
        text : i1.text || i2.text,
        alternateText : i1.text && i2.text,
        amount : mergeAmounts(i1.amount,i2.amount)
    }
}

export function parseIngredients (text, ingredients) {
    for (let i of ingredients) {
        text = markupTextForIngredient(text,i);
        if (i.ingredients) {
            for (let ii of i.ingredients) {
                text = markupTextForIngredient(text,ii);
            }
        }
    }
    return text;
}
export function markupTextForIngredient (text,ing) {
    if (!ing || !ing.text) {return text}
    let highlighters = getIngredientHighlighters(ing);
    for (let i=0; i<=3; i++) { // up to three highlights per ingredient only
        let highlighter = highlighters[i]
        if (highlighter) {
            text = text.replace(
                highlighter.matcher,
                function (v) {
                    let text = arguments[arguments.length - 1] // work around grouping
                    let idx = arguments[arguments.length - 2]
                    if (!inTag(idx,text)) {
                        return `<ing target="${ing.text}">${v}</ing>`
                    }
                    else {
                        return v;
                    }
                }
            )
        }
    }    
    return text
}
    


function getIngredientHighlighters (item) {
    return getItemMatchers(item.text)
}

export function highlightItem (item, stag='<b>', etag='</b>') {
    if (item.text) {
        return highlightItemText(item.text);
    }
    else {
        return ''
    }
}

export function highlightItemText (text,stag='<b>',etag='</b>') {
    // given an ingredient, highlight the item in it.
    let allMyMatchers = getItemMatchers(text);
    let alreadyMatched = [];
    for (let m of allMyMatchers) {
        if (!m.string) {
            m.string = reToString(m.matcher).substr(2);
            m.string = m.string.substring(0,m.string.length-2)
        }
        let useMe = true;
        for (let otherMatcher of alreadyMatched) {
            if (otherMatcher.indexOf(m.string) > -1) {
                useMe = false;
            }
        }
        if (useMe) {
            text = text.replace(m.matcher,(v)=>stag+v+etag);
            alreadyMatched.push(reToString(m.matcher));
        }
    }
    return text;
}

export function getItemMatchers (text) {
    let words = extractItems(text).filter((w)=>w);
    // Since we're going through n^2 words, it's probably worth putting a limit on how many words we allow...
    words = words.slice(0,10); // 10*10 iterations should cut it...
    words = words.filter((w)=>w.length>1).map((w)=>w+'?e?s?')
    // Now let's find contiguous meaningful words and keep them together...
    let matchers = [];
    for (let si=0; si<words.length; si++) { // start index
        for (let ei=si+1; ei<words.length+1; ei++) { // end index...
            let matcher = new RegExp('\\b'+(words.slice(si,ei).join('[\\s,.-]+'))+'\\b','gi');
            if (text.match(matcher)) {
                matchers.push(
                    {matcher,
                     length:ei-si}
                );
            }
        }
    }
    matchers.sort((a,b)=>a.length<b.length ? 1 : -1)
    return matchers
}

export function extractItems (text) {
    let words = text.split(/[^\w\u00C0-\u017F]+/)
    words = stopword.removeStopwords(words);
    words = stopword.removeStopwords(words,prepWords);
    words = stopword.removeStopwords(words,
                                     [/chop(s|ped)?/i,/mince[sd]?/i])
    return words;
}

export function getNutritionQuery (text) {
    let words = text.split(/[^\w\u00C0-\u017F]+/);
    let searchWords = stopword.removeStopwords(words);
    let keyWords = stopword.removeStopwords(searchWords,prepWords);
    keyWords = stopword.removeStopwords(keyWords,
                                     [/chop(s|ped)?/i,/mince[sd]?/i]);
    let query = '';
    for (let word of searchWords) {
        if (keyWords.indexOf(word)>-1) {
            query += ' +'+word
        } else {
            query += ' '+word; 
        }
    }
    if (query.length) {
        // cut off first space
        query = query.substr(1); 
    }
    return query;
}

export function getShopItem (ingredient) {
     if (ingredient.shopItem) {
         return ingredient.shopItem
     } else {
         let words = extractItems(ingredient.text)
         if (words.length > 0) {
             return titleCase(words.join(' ')||'');
         } else {
             return titleCase(ingredient.text||'');
         }
     }
}
