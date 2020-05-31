import { get } from 'svelte/store'
import {floatToFrac,numMatchString,parseAmount} from './numbers.js';
import {reToString} from './regExpUtil.js';
import {getSurroundingSentence} from './textUtils.js';

let M = 60;
let H = 60*60;
let D = H * 24;
let W = D * 7;
let MNTH = D * 31
let YR = D * 365;



function f2 (n) {
    return Math.floor(n).toString(10).padStart(2,'0')
}
function f (n) {
   return Math.floor(n).toString(10)
}

const timeWords = [
    {matcher:/\b(sec(ond)?s?)\b/i,
     name:'second',
     value:1},
    {matcher:/\b(min(ute)?s?)\b/i,
     name:'minute',
     value:M},
    {matcher:/\b(h(ou)?rs?)\b/i,
     name:'hour',
     value:H},
    {matcher:/\b(da?ys?)\b/i,
     name:'day',
     value:D},
    {matcher:/\b(we+ks?)\b/i,
     name:'week',
     value:W},
    {matcher:/\b(mo?n?ths)\b/i,
     name:'month',
     value:MNTH},
    {matcher:/\b(y(ea)?rs?)\b/i,
     name:'year',
     value:YR}
]

//// Built this but then used unit extraction instead, so this is probably useless
//// But I'm keeping the code around for good measure :)
// Named groups for extracting values out of a string -- assumes values are ordered biggest to smallest units.
//const timeValueMatcher = /(\b(?<year>\d)\s*(y(ea)?rs?)\b)?[,& and\s]*((?<month>\d)\s*(\b(mo?n?ths)\b))?[,& and\s]*((?<week>\d)\s*(\b(we+ks?)\b))?[,& and\s]*((?<day>\d)\s*(\b(da?ys?)\b))?[,& and\s]*((?<hour>\d)\s*(\b(h(ou)?rs?)\b))?[,& and\s]*((?<minute>\d)\s*(\b(min(ute)?s?)\b))?[,& and\s]*((?<second>\d)\s*(\b(sec(ond)?s?)\b))?/gi;
// Next up, we have a matcher for IDENTIFYING strings - no named groups are possible with all the "or" statements we need, but it's still pretty cool
// function buildTimeValueMatcher () {
//     let regexp = '\\b'
//     for (let i=timeWords.length-1; i > -1; i--) {
//         let unit = timeWords[i]
//         let matcher = reToString(unit.matcher);
//         regexp += `(?<${unit.name}>${matcher})?`
//         if (i > 0) {
//             regexp += '(\\s*(and|\\W)?\\s*)?'
//         }
//     }
//     return new RegExp(regexp,'ig');
// }

//const timeValueMatcher = buildTimeValueMatcher();

function buildAtLeastOneTimeMatcher () {
    let regexParts = []         // 
    //for (let i=(timeWords.length-1); i > -1; i--) {
    //let requiredUnit = timeWords[i];
    for (let requiredUnit of timeWords) {
        let regexPart = '('
        let stopAt = timeWords.indexOf(requiredUnit);
        for (let i=(timeWords.length-1); i >= stopAt; i--) {
            let unit = timeWords[i];
            //for (let unit of timeWords) {
            let unitMatcher = '\\d+\\s*'+reToString(unit.matcher).replace(/\\b/g,'');
            if (unit==requiredUnit) {
                regexPart += '('+unitMatcher+')'
            }
            else {
                regexPart += `(${unitMatcher})?`
            }
            if (i > stopAt) {
                regexPart += '(\\s*(and|\\W)?\\s*)'
            }
        }
        regexPart += ')'
        regexParts.push(regexPart)
    }
    return new RegExp(regexParts.join('|'),'ig')
}

//const timeMatcher = buildAtLeastOneTimeMatcher(); // led to catatrophic backtracking in at least one case :(
const timeMatcher = /((\band|\W+\b)?\s*\d+\s[acdehikmnorstuw]+\s*)+/ig // Much simplified -- less precise, but maybe won't leaad to catastrophic failure?
const fancyTimeMatcher = new RegExp(reToString(timeMatcher).replace('\\d+',numMatchString),'ig');
//const fancyTimeValueMatcher = new RegExp(reToString(timeValueMatcher).replace('\\d',numMatchString),'gi');

export function getTimeUnit (s) {
        for (let i=timeWords.length-1; i>-1; i--) {
            let matcher = timeWords[i];
            if (s.match(matcher.matcher)) {
                return matcher.value;
            }
        }
}

export function getSecondsFromString (s) {
    let stringToParse = s
    let amounts = []
    while (stringToParse) {
        let amount = parseAmount(stringToParse);
        if (amount.posttext && amount.posttext != stringToParse) {
            let timeUnit = getTimeUnit(amount.posttext)
            if (amount.amount) {
                amounts.push(
                    {
                        amount:amount.amount,
                        unit:timeUnit
                    }
                )
                stringToParse = amount.posttext
            }
            else {
                stringToParse = '';
            }
        } else {
            stringToParse = '';
        }
    }
    let total = 0;
    for (let t of amounts) {
        total += t.amount * t.unit
    }
    return total
}

export function parseTimes (s, includeSentence) {
    let lastMatchOffset = -1
    return s.replace(
        fancyTimeMatcher,
        function (matchString) {
            let offset = arguments[arguments.length-2]
            let seconds = getSecondsFromString(matchString)
            // fix whitespace!
            if (seconds) {
                let ts,leading,content,trailing
                let whitespaceMatch = matchString.match(
                        /^(\s*)(.+?)(\s*)$/
                );
                if (whitespaceMatch) {
                    [ts,leading,content,trailing]  = whitespaceMatch;
                } else {
                    content = matchString;
                    leading = ''; trailing = '';
                }
                if (lastMatchOffset > offset) {
                    lastMatchOffset = s.length // scratch it if we're nested
                }
                let context = getSurroundingSentence(s,offset,lastMatchOffset).replace("'","\\'");
                lastMatchOffset = offset + matchString.length - 1;
                return `${leading}<duration context='${context}' seconds=${seconds}>${content}</duration>${trailing}`
            }
            else {
                return matchString;
            }
        }
    );
}



export default {
    
    timeMatcher,
    //timeValueMatcher,
    fancyTimeMatcher,
    //fancyTimeValueMatcher,
    getTimeUnit,
    getSecondsFromString,
    parseTimes,
    
    getTimeLabel (s) {
        if (s < 0) {
            return '-' + this.getTimeLabel(-1*s);
        }
        if (s < H) {
            return `${f2(s / 60)}:${f2(s % 60)}`
        }
        else if (s < H * 24) {
            return `${f(s / (H))}h:${f2((s % (H)/60))}`
        }
        else if (s < H * 24 * 14) {
            return `${f(s / (H*24))} days`
        }
        else if (s < H * 24 * 7 * 12) {
            return `${f(s / (H*24*7))} weeks`
        }
        else if (s < H * 24 * 365) {
            return `${f(s / (H*24*31))} months`
        }
        else  {
            return `${f(s / (H*24*365))} years`
        }
    },

    getScale (s) {
        if (s <= 60) { // one minute timer
            return {m:60,u:5};
        }
        else if (s <= 60 * 15) { // fifteen minute timer
            return {m:60*12,u:30} // 30 second units
        }
        else if (s <= H) { // hour timer
            return {m:H,u:5*60} // 5 minute units
        }
        else if (s <= H*4) { // four hours...
            return {m:H*4,u:15*60} // fifteen minute units
        }
        else if (s <= H*12) { // 12 hour timer
            return {m:H*12,u:30*60} // 30 minute units
        }
        else if (s <= H*24) { // 24 hour timer
            return {m:H*24,u:H} // hour units
        }
        else if (s <= H*24*7) { // one week timer
            return {m:H*24*7,u:24*H} // one day units
        }
        else if (s <= H*24*31) { // one month timer
            return {m:H*24*31,u:24*7*H} // one week units
        }
        else { // 5 year timer
            return {m:H * 24 * 365 * 5,
                    u:H * 24 * 365/4} // quarter year units
        }
    },

    getHMS (seconds) {
        if (isNaN(seconds)) {
            new Error(
                `getHMS requires a number but got ${seconds}`
            );
        }
        let hours = Math.floor(seconds / H)
        let remainder = seconds - (hours*H)
        let minutes = Math.floor(remainder / M);
        seconds = Math.floor(remainder - (minutes*M))
        return {
            seconds,minutes,hours
        }
    },

    HMStoSeconds (HMS) {
        return HMS.hours * H + HMS.minutes * M + HMS.seconds
    },

    getDescription (s) {
        s = Math.floor(s)
        const hms = this.getHMS(s);
        if (!hms.hours) {
            if (!hms.minutes) {
                return `${hms.seconds} seconds` // fix me
            }
            if ([0,15,30,45].indexOf(hms.seconds)>-1) {
                return `${floatToFrac(hms.minutes,{fallbackDigits:0})} minutes`
            } else {
                return `${floatToFrac(hms.minutes)} minutes, ${floatToFrac(hms.seconds,{fallbackDigits:0})} seconds`
            }
        }
        if (hms.hours < 24) {
            if ([0,15,30,45].indexOf(hms.minutes)>-1) {
                return `${floatToFrac(s/H,{fallbackDigits:0})} hours`
            }
            else {
                return `${floatToFrac(hms.hours)} hour ${floatToFrac(hms.minutes)} minutes`
            }
        }
        else if (hms.hours < 24*7) {
            return `${floatToFrac(s/D,{fallbackDigits:0})} days`
        }
        else if (hms.hours < 35*7) {
            return `${floatToFrac(s/W,{fallbackDigits:0})} weeks`
        }
        else if (hms.hours < 24*7*365) {
            return `${floatToFrac(s/MNTH,{fallbackDigits:0})} months`
        }
        else {
            return `${floatToFrac(s/YR,{fallbackDigits:0})} years`
        }
    }

}
