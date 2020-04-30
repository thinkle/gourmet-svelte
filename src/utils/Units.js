import {frac_to_float,float_to_frac,numMatchString} from './Numbers.js';
import Amounts from './Amounts.js';
var timeUnits = undefined
var timeConversions = {} // gets populated in getTimeUnits()
var timeEquivs = {
    'seconds':['s','sec','secs','second'],
    'minutes':['min','minute','mins','min.'],
    'hours':['hr','hr.','hour','hrs'],
    'days':['day'],
    'weeks':['week','wk'],
}

var timeEquivRegexps = {
}

for (var unit in timeEquivs) {
    timeEquivs[unit].push(unit);
    timeEquivRegexps[unit] = new RegExp(`(${numMatchString})\\s+(${timeEquivs[unit].join('|')})`);
}

function getTimeUnits () { /* singleton */
    if (timeUnits) {return timeUnits}
    else {
        timeUnits = [
            ['seconds', 1],
            ['minutes', 60],
            ['hours', 60],
            ['days', 24],
            ['weeks', 7],
        ];
        // Accumulator - get all our units in terms of the first...
        var multiplier = 1
        for (var u of timeUnits) {
            u[1] *= multiplier;
            multiplier = u[1];
            timeConversions[u[0]] = u[1];
        }
        return timeUnits;
    }
}

function secondsToTime (s) {
    var units = getTimeUnits().slice();
    var unitsToUse = [];
    var remainder = s;
    while (units.length>0) {
        var biggest = units.pop();
        if ((remainder / biggest[1]) > 1) {
            unitsToUse.push(
                {amount:Math.floor(remainder/biggest[1]),
                 unit:biggest[0]}
            );
            remainder = remainder % biggest[1]
        }
    }
    return unitsToUse;
}

/*
* get time from messy user strings, such as...
* 30:00 -> 30 minutes
* 30 minutes -> 30 minutes
* 1/2 hour -> 30 minutes
* 2 weeks, 3 days -> 2 weeks + 3 days
* etc.
* Time is returned in seconds.
*/

function timeFromString (txt) {
    var parsers = [checkForColonTimeString,checkForTimeWords];
    for (var parse of parsers) {
        var result = parse(txt);
        if (result) {
            return result
        }
    }
}

function checkForTimeWords (txt) {
    var timeUnits = getTimeUnits();
    var total = 0;
    for (var unit in timeEquivRegexps) {
        var re = timeEquivRegexps[unit];
        var match = txt.match(re);
        if (match) {
            var num = frac_to_float(match[1]);
            var converter = timeConversions[unit];
            if (!converter) {
                throw 'No converter found for unit '+unit;
            }
            total += converter * num;
        }
    }
    return total;
}

function checkForColonTimeString (txt) {
    var hourMinute = /^\s*[0-9][0-9]?:[0-9][0-9]\s*$/;
    var hourMinuteSecond = /^\s*[0-9][0-9]?:[0-9][0-9]:[0-9][0-9]\s*$/;
    if (txt.match(hourMinute)) {
        var times = txt.split(':').map(Number)
        return times[0] * 60*60 + times[1]*60;
    }
    if (txt.match(hourMinuteSecond)) {
        var times = txt.split(':').map(Number)
        
        return (
            (times[0] * 60*60) + // hours
                (times[1]*60) + // minutes 
                (times[2])); // seconds
    }
}

// function testTimes () {
//     var times = [34,60*2+42,60*60*24*9,60*60*60+234,7*24*60*60+24*60*60*2+60*60*2+6]
//     times.forEach(
//         (s)=>console.log('secondsToTime(%s)=>%s',s,JSON.stringify(secondsToTime(s)))
//     );
// }
// testTimes();

var Units = {
    secondsToTimeUnits : secondsToTime,
    secondsToTimeString  (s) {
        return Units.toString(Units.secondsToTimeUnits(s));
    },
    toString (unitSequence) {
        return unitSequence.map((o)=>`${o.amount} ${o.unit}`).join(', ')
    },
    secondsFromTimeString : timeFromString,
    timeEquivRegexps : timeEquivRegexps,
    Amounts
}
export default Units;
