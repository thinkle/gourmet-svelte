//import numeral from 'numeral';

// numeral.register('format', 'fraction', {
//     regexps: {
//         format: /\//,
//         unformat: /\//
//     },
//     format: function(value, format, roundingFunction) {
// 	return float_to_frac(value);
//     },
//     unformat: function(string) {
//         return frac_to_float(string);
//     }
// });
import Amounts from './Amounts.js'; 

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

function getFraction (n, d) {
    for (var f of NUMBER_FRACTIONS) {
	if (n==f.numerator && d==f.denominator) {
	    return f.word
	}
    }
    return n+'/'+d
}

function float_to_frac (n, {denominators=[2,3,4,6,8,10,16], approx=0.01, fallbackDigits=2}={}) {
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
		    return i+' '+getFraction(...result);
                }
                else {
                    return getFraction(...result);
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
function frac_to_float (s) {
    if (!s.split) {
        return Number(s); // if we are not a string, just use Number...
    }
    var parts = s.split(/ +/);
    if (parts.length==2) {
	var num = Number(parts[0]);
	var frac = parts[1];
    }
    else {
	var num = 0;
	var frac = parts[0];
    }
    var frac_split = frac.split(/\//);
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
    return Number(s)
}

var numBase = `([0-9]|${NUMBER_FRACTIONS.map((f)=>f.word).join('|')}`;
var numNaked = numBase + ')';
var numMid = numBase + '|[,./])' 
var numMatchString = `${numNaked}+(${numMid}*${numNaked}+)?`
var numMatchString = `${numMatchString}(\\s+${numMatchString})?`
var numberMatcher = new RegExp(numMatchString);

export {float_to_frac, frac_to_float, numberMatcher, numMatchString}
