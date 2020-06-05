import {parse, end, toSeconds, pattern} from 'iso8601-duration';
import Times from '../utils/times.js';
import {parseAmount} from '../utils/numbers.js';
import {cleanupWhitespace,titleCase} from '../utils/textUtils.js';
import {ignoreMatchingDescendants} from './importer.js';

export function handleTime (chunk, context, recipe) {
    ignoreMatchingDescendants(chunk,context);
    let amount;
    if (!amount) {
        amount = parseAmount(chunk.text);
        amount.unit = Times.getTimeUnit(chunk.text);
        amount.seconds = amount.amount * amount.unit;
        if (amount.pretext) {
            amount.name = titleCase(cleanupWhitespace(amount.pretext))
        }
        else {
            amount.name = 'Time'
        }
    }
    amount.text = cleanupWhitespace(chunk.text)
    if (chunk.html) {
        let duration
        // Try parsing time...
        let doc = new DOMParser().parseFromString(chunk.html,'text/html');
        let candidate = doc.querySelector('*[datetime]')
        if (candidate) {
            amount.seconds = toSeconds(parse(candidate['dateTime']));
            amount.iso8601 = candidate['dateTime']
        }
    }
    if (chunk.detail) {
        amount.name = chunk.detail
    }
    if (!recipe.times) {
        recipe.times = []
    }
    recipe.times.push(amount);
}

