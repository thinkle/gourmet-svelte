export function cleanupWhitespace (text, condenseMiddleSpaces=true) {
    text = text
        .replace(/^\s+/,'') // leading whitespace
        .replace(/\s+$/,'') // trailing whitespace
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
    return words.split(/\s/).map(
        (word)=>word[0].toUpperCase()+word.substr(1).toLowerCase()
    ).join(' ')
}
