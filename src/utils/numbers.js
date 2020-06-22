//import numeral from 'numeral';

// numeral.register('format', 'fraction', {
//     regexps: {
//         format: /\//,
//         unformat: /\//
//     },
//     format: function(value, format, roundingFunction) {
// 	return floatToFrac(value);
//     },
//     unformat: function(string) {
//         return fracToFloat(string);
//     }
// });
import Amounts from './unitAmounts.js'; 
import {countGroupsInRegexp} from './regExpUtil.js';

var NUMBER_WORDS = [
    {matcher:/\b(one|a)\b/i,
     value:1},
    {matcher:/(two|\ba\s*(couple|pair)\b)/i,
     value:2},
    {matcher:/(\b(one|a)\b\s*)?half(\s+(a|an))?\b/i,
     value:0.5},
    {matcher:/\bthree\b/i,value:3},
]


var LESS_THAN_TWENTY = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
];

var TENTHS_LESS_THAN_HUNDRED = [
    'zero', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

for (let i=0; i<20; i++) {
    let word = LESS_THAN_TWENTY[i]
    NUMBER_WORDS.push({
        matcher : new RegExp('\\b'+word+'\\b','i'),
        value : i
    })
}
for (let t=2; t<10; t++) {
    let tens = TENTHS_LESS_THAN_HUNDRED[t];
    NUMBER_WORDS.push({
        matcher : new RegExp('\\b'+tens+'\\b','i'),
        value : t*10
    })
    for (let i=1; i<10; i++) {
        let ones = LESS_THAN_TWENTY[i]
        NUMBER_WORDS.push({
            matcher : new RegExp('\\b'+tens+'(\\s*|-|–)'+ones+'\\b','i'),
            value : t*10 + i
        })
    }
}

for (let word of NUMBER_WORDS) {
    if (isNaN(word.value)) {
        throw Error(`bad word ${word.matcher} ${word.value}`);
    }
}
NUMBER_WORDS.reverse(); // longest to shortest - match greedy first


function getValueFromNumberWord (s) {
    let value = NaN;
    for (let numberWord of NUMBER_WORDS) {
        // We assume NUMBER_WORDS is in order from most to least
        // specific, so if, for example twenty-two matches twenty and
        // two and twenty-two, twenty-two will come first.
        // I *think* but haven't rigorously confirmed that this works
        // for all numbers with larger numbers being more specific than
        // smaller numbers in terms of regexp matching
        if (s.match(numberWord.matcher)) {
            return numberWord.value
        }
    }
}


var NUMBER_FRACTIONS = [
    {numerator:1,
     denominator:2,
     word:'\u00BD'},
    {numerator:1,
     denominator:4,
     word:'\u00BC'},
    {numerator:3,
     denominator:4,
     word:'\u00BE'},
    {numerator:1,
     denominator:3,
     word:'\u2153'},
    {numerator:2,
     denominator:3,
     word:'\u2154'},
    {numerator:1,
     denominator:5,
     word:'\u2155'},
    {numerator:2,
     denominator:5,
     word:'\u2156'},
    {numerator:3,
     denominator:5,
     word:'\u2157'},
    {numerator:4,
     denominator:5,
     word:'\u2158'},
    {numerator:1,
     denominator:6,
     word:'\u2159'},
    {numerator:5,
     denominator:6,
     word:'\u215A'},
    {numerator:1,
     denominator:8,
     word:'\u215B'},
    {numerator:3,
     denominator:8,
     word:'\u215C'},
    {numerator:5,
     denominator:8,
     word:'\u215D'},
    {numerator:7,
     denominator:8,
     word:'\u215E'},
]

function getFraction (n, d, unicodeFractions=true) {
    if (unicodeFractions) {
        for (var f of NUMBER_FRACTIONS) {
	    if (n==f.numerator && d==f.denominator) {
	        return f.word
	    }
        }
        return n + '⁄' + d; // fancy unicode fraction slash
    }
    return n+'/'+d
}

function floatToFrac (n, {denominators=[2,3,4,5,6,8,16], approx=0.01, fallbackDigits=2,
                          unicodeFractions=true,multiplier=1}={}) {
    n *= multiplier
    if (n===0) {
        return '0'
    }
    else if (!n) {
        return ''
    }
    var i, f
    if (n >= 1) {
	i = Math.floor(n).toString()
    }
    else {
	i = ''
    }
    var rem = n % 1;
    if (rem==0 || rem<approx) {
	return i || '0'
    }
    else {
	// now we fractify...
	for (var den of denominators) {
	    var result = fractify(rem,den)
	    if (result) {
                if (i) {
		    return i+' '+getFraction(...result,unicodeFractions);
                }
                else {
                    return getFraction(...result,unicodeFractions);
                }
	    }
	}
	// If we failed, we just format...
	return n.toFixed(fallbackDigits);
    }
}

function fractify (decimal, divisor, approx=0.01) {
    /* Return fraction equivalent of decimal using divisor.
       If we don't have a fit, return none */
    var one_nth = 1/divisor // we have the one version...
    //console.log('one_nth=',one_nth);
    var numerator = decimal / one_nth;
    //console.log('numerator=',numerator);
    if (Math.abs(Math.round(numerator)-numerator) < approx) {
	return [Math.round(numerator),divisor]
    }
    else {
	return false
    }
}

// translation to javascript
/*We assume fractions look like this (I )?N/D */
function fracToFloat (s) {
    if (!s.split) {
        return Number(s); // if we are not a string, just use Number...
    }
    if (['/','⁄'].indexOf(s[s.length-1])>-1) {
        // if we end with a slash, we are not a number...
        return NaN
    }
    var parts = s.split(/\s+/);
    if (parts.length==2) {
	var num = Number(parts[0]);
	var frac = parts[1];
    }
    else {
	var num = 0;
	var frac = parts[0];
    }
    var frac_split = frac.split(/[\/⁄]/);
    if (frac_split.length==2) {
	return  num + (Number(frac_split[0])/Number(frac_split[1]))
    }
    else {
	// let's look for fraction unicode...
	for (var f of NUMBER_FRACTIONS) {
	    if (frac==f.word) {return num+(f.numerator/f.denominator)}
	}
    }
    // If we are still here, let's just try a regular conversion
    if (s.match(/[0-9]([,][0-9][0-9][0-9])+([.][0-9]+)?$/)) {
        s = s.replace(/[,]/g,'')
    }
    if (s.match(/[0-9]([.][0-9][0-9][0-9])+([,][0-9]+)?$/)) {
        s = s.replace(/[.]/g,'');
    }
    let val = Number(s)
    if (!isNaN(val)) {
        return val
    }
    else {
        let wordValue = getValueFromNumberWord(s)
        if (wordValue) {
            return wordValue
        }
    }
}


var numBase = `([0-9]|${NUMBER_FRACTIONS.map((f)=>f.word).join('|')}`;
numBase += '|' + NUMBER_WORDS.map((w)=>w.matcher.toString().replace(/(^\/|\/i$)/g,'')).join('|')
var numNaked = numBase + ')';
var numMid = numBase + '|[,./⁄])' 
var numMatchString = `${numNaked}+(${numMid}*${numNaked}+)?`
var fracMatchString = `(${NUMBER_FRACTIONS.map((f)=>f.word).join('|')}|\\d[/⁄]\\d)`
numMatchString = `${numMatchString}(\\s+${fracMatchString})?`
var numberMatcher = new RegExp(numMatchString,'i');
//var rangeMatcherString = `(?<first>${numMatchString})(?<rangeword>\\s*(to|or|-|:|–|—|―)\\s*)(?<second>${numMatchString})` // FF doesn't support named groups :(
var rangeMatcherString = `(${numMatchString})(\\s*(to|or|-|:|–|—|―)\\s*)(${numMatchString})`
var rangeMatcher = new RegExp(rangeMatcherString,'i')

const groupsInRangeExpression = 2
var groupsInNumMatcher = countGroupsInRegexp(numMatchString)
//const groupsInRangeMatcher = countGroupsInRegexp(rangeMatcherString)
export const firstRangeGroup = 1 // 0 is the whole thing, 1 is next...
// container group for first number + all the number groups for that number + range group + 1 + 1
export const secondRangeGroup = firstRangeGroup + groupsInNumMatcher + groupsInRangeExpression

 function roundDown (v, n) {
     return Math.floor(v/n)*n
 }
 function roundUp (v, n) {
     return Math.ceil(v/n)*n
 }

function increment (n) {
    if (n > 100) {
        return roundDown(n,25)+25
    }
    else if (n > 50) {
        return roundDown(n,10)+10
    }
    else if (n > 10) {
        return roundDown(n,5)+5
    }
    else if (n > 5) {
        return roundDown(n,1)+1
    }
    else {
        let fraction = getNearestFraction(n);
        if (!fraction) {
            return n * 2
        }
        else {
            const [top,bottom] = fraction;
            return (top + 1)/bottom
        }
    }
}

function getNearestFraction (n, options=[1,2,3,4,5,8,10,16],approx=0.1) {
    for (let o of options) {
        let answer =  fractify(n,o,approx);
        if (answer) {
            return answer
        }
    }
}

function decrement (n) {
    if (n > 100) {
        return roundUp(n,25)-25
    }
    else if (n > 50) {
        return roundUp(n,10)-10
    }
    else if (n > 10) {
        return roundUp(n,5)-5
    }
    else if (n > 5) {
        return roundUp(n,1)-1
    }
    else {
        let fraction = getNearestFraction(n);
        if (!fraction || fraction[0]==0) {
            return n / 2
        }
        else {
            const [top,bottom] = fraction;
            if (top > 1) {
                return (top - 1)/bottom
            }
            else {
                return 1 / nextBottom(bottom)
            }
        }
    }


    function nextBottom (bottom) {
        const bottoms = [1,2,3,4,8,16]
        let curIndex = bottoms.indexOf(bottom)
        if (!curIndex || curIndex > bottoms.length) {
            return bottom * 2
        }
        else {
            return bottoms[curIndex+1]
        }
    }
}

let numberBeforeUnitMatcher = new RegExp(numMatchString+'(?=\\s+[^\\d/⁄])')

function parseAmount (s) {
    let amount = {}
    let rangeMatch = s.match(rangeMatcher);
    let numberMatch = s.match(numberMatcher);
    let numberBeforeUnitMatch = s.match(numberBeforeUnitMatcher);
    let match
    // If our rangeMatch is first in the string, use it...
    if (rangeMatch && (!numberMatch || rangeMatch.index <= numberMatch.index)) {
        // amount.rangeAmount = fracToFloat(rangeMatch.groups.first);
        // amount.amount = fracToFloat(rangeMatch.groups.second);        
        // amount.textAmount = rangeMatch.groups.second
        // amount.textRangeAmount = rangeMatch.groups.first
        amount.textRangeAmount = rangeMatch[firstRangeGroup]
        amount.textAmount = rangeMatch[secondRangeGroup]
        amount.rangeAmount = fracToFloat(amount.textRangeAmount)
        amount.amount = fracToFloat(amount.textAmount)
        match = rangeMatch
    } else if (numberBeforeUnitMatch) {
        // maybe we should just use the first number -- but let's try a
        // "number before unit" thing which tries to grab the number preferentially
        // in front of a unit, but that can go badly it seems... when you have things like
        // 1 14 oz can, what is right?
        // maybe (14) (oz) (1 can...)
        // or maybe (1) () (14 oz can)
        // of course (1) (14 oz) (can) is never going to happen...
        amount.amount = fracToFloat(numberBeforeUnitMatch[0])
        amount.textAmount = numberBeforeUnitMatch[0]
        match = numberBeforeUnitMatch        
    } else if (numberMatch) {
        amount.amount = fracToFloat(numberMatch[0])
        amount.textAmount = numberMatch[0]
        match = numberMatch
    }
    if (match) {
        amount.pretext = s.substr(0,match.index)
        amount.posttext = s.substr(match.index+match[0].length)
    }
    else {
        amount.posttext = s;
    }
    return amount
}

export function formatAmount (amount,options) {
    if (!amount) {
        return ''
    }
    if (amount.rangeAmount) {
        return `${floatToFrac(amount.rangeAmount,options)}–${floatToFrac(amount.amount,options)}`.replace(' ','\xa0'); // non-breaking space
    }
    else {
        return floatToFrac(amount.amount,options).replace(' ','\xa0'); // non-breaking space;
    }
}


export {floatToFrac, fracToFloat, parseAmount,
        numberMatcher, numMatchString,
        rangeMatcherString, rangeMatcher,
        increment, decrement,
        //firstRangeGroup, secondRangeGroup,
       }
