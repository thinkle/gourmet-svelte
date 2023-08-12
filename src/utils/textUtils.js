export function cleanupWhitespace (text, condenseMiddleSpaces=true) {
    text = text
        .replace(/^\s+/,'') // leading whitespace
        .replace(/\s+$/,'') // trailing whitespace
        .replace(/^[,.;]\s*/,'') // leading punctuation
    if (text.match(/stick/)) {
        console.log('cleaned-up ',text)
    }

    if (condenseMiddleSpaces) {
        return text
            .replace(/\s+/g,' ') // extra whitespace -> single
    }
    else {
        return text
    }
}

export function titleCase (words) {
    if (!words) {return words}
    return words.split(/\s/).map(
        (word)=>{
            if (word.length < 2) {
                return word
            } else {
                return word[0].toUpperCase()+word.substr(1).toLowerCase()
            }
        }
    ).join(' ')
}

export function jsonConcisify (o) {
    return JSON.stringify(
        o,
        (k,v) => {
            if (typeof v==='string' && v.length > 50) {
                return v.substr(0,47)+'...'
            }
            if (Array.isArray(v)) {
                return [v[0],'...']
            }
            else {
                return v;
            }
        }
    );
}

export function getSurroundingSentence (text, targetOffset, startAfter=-1) {
    if (!text) {return text}
    let sentenceBoundaries = '.!?'
    let beginningIndex = startAfter + 1; // if we never find a sentence boundary
    for (let i=targetOffset; i>startAfter; i--) {
        if (sentenceBoundaries.indexOf(text[i])>-1) {
            beginningIndex = i+1; // override if we find a sentence boundary
            break;
        }
    }
    let finalIndex = text.length; // if we never find an end boundary...
    for (let i=targetOffset; i<text.length; i++) {
        if (sentenceBoundaries.indexOf(text[i])>-1) {
            finalIndex = i+1;
            break;
        }
    }
    return text
        .substr(beginningIndex,finalIndex-beginningIndex)
        .replace(/^[\s,;:.]*|\s*$/g,'');
}

export function inTag (idx, text) {
    // Very simple checker to see if we are in a tag... if we search backward and find
    // a < before a >, then we *are* in the tag
    if (!text) {return text}
    for (let i=idx; i>-1; i--) {
        if (text[i]=='>') {
            return false // that's the end of a tag, so we were not in a tag
        } else if (text[i]=='<') {
            return true; // that's the start of a tag, so we *were* in one
        }
    }
    return false; // never saw a < or a >, so we were not in a tag.
}

export function htmlToSentences (html) {
    for (let tag in ['li','p','div','blockquote','section','article']) {
        html = html.replace(`</${tag}>`,'~.~ ') // weird period placeholder...
    }
    html = html.replace(/[.]?~[.]~/g,'') // end each block with one and only one period
    // now strip everythign else
    html = html.replace(/<[^>]+>/g,'');
    return html
}
