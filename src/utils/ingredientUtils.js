import stopword from 'stopword'
import {reToString} from './regExpUtil.js'
import prepWords from './ingPrepWords.js';
import {inTag} from './textUtils.js';

export function parseIngredients (text, ingredients) {
    for (let i of ingredients) {
        text = markupTextForIngredient(i);
        if (i.ingredients) {
            for (let ii of i.ingredients) {
                text = markupTextForIngredient(ii);
            }
        }
    }
    return text;

    function markupTextForIngredient (ing) {
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
    
}

function getIngredientHighlighters (item) {
    return getItemMatchers(item.text)
}

export function highlightItem (item, stag='<b>', etag='</b>') {
    if (item.text) {
        return highlightItemText(item.text);
    }
    else {
        return 'No item'
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
    words = words.slice(0,50); // 50*50 iterations should cut it...
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
    let words = text.split(/\W+/)
    words = stopword.removeStopwords(words);
    words = stopword.removeStopwords(words,prepWords);
    words = stopword.removeStopwords(words,
                                     [/chop(s|ped)?/i,/mince[sd]?/i])
    return words;
}
