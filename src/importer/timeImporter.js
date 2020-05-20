import {parse, end, toSeconds, pattern} from 'iso8601-duration';
import Times from '../utils/times.js';
import {parseAmount} from '../utils/numbers.js';

function handleTime (chunk, context, recipe) {
    let amount;
    if (chunk.html) {
        let duration
        // Try parsing time...
        let doc = new DOMParser().parseFromString(chunk.html,'text/html');
        let candidate = doc.querySelector('*[datetime]')
        if (candidate) {
            let elWithDatetime = document.querySelector('*[datetime]')
            if (elWithDatetime) {
                let duration = toSeconds(parse(elWithDatetime['dateTime']));
            }
            amount = {
                seconds : duration,
                iso8601 : elWithDatetime['datetime']
            }
        }
    }
    if (!amount) {
        let amount = parseAmount(chunk.text);
        amount.unit = Times.getTimeUnit(chunk.text);
        amount.seconds = amount.amount * amount.unit;
        if (amount.pretext) {
            amount.label = titleCase(cleanupWhitespace(amount.pretext))
        }
        else {
            amount.label = 'Time'
        }
    }
    
    amount.text = cleanupWhitespace(chunk.text)
    recipe.times.push(amount);
}

