import {float_to_frac, frac_to_float, rangeMatcher, rangeMatcherString, numberMatcher, numMatchString, increment, decrement, parse_amount} from './Numbers.js'

it(
    'Number Matchers',
    ()=>{
        function exactMatch (s,matcher) {
            expect('2 1/2').toEqual(expect.stringMatching(numberMatcher))
            expect('4 3/4').toEqual(expect.stringMatching(numberMatcher))
            expect('\u00BE').toEqual(expect.stringMatching(numberMatcher))
            expect('4,000').toEqual(expect.stringMatching(numberMatcher))
            expect('seven').toEqual(expect.stringMatching(numberMatcher))
            expect('ten').toEqual(expect.stringMatching(numberMatcher))
            expect('zero').toEqual(expect.stringMatching(numberMatcher))
            expect('seventy two').toEqual(expect.stringMatching(numberMatcher))
            expect('thirty-three').toEqual(expect.stringMatching(numberMatcher))
            expect('4,000,300').toEqual(expect.stringMatching(numberMatcher))
            expect('2 1/').toEqual(expect.not.stringMatching(numberMatcher))
            expect('2 / 4 / 20').toEqual(expect.not.stringMatching(numberMatcher))
            expect('2,200,20').toEqual(expect.not.stringMatching(numberMatcher))
        }
    }
);

it(
    'Range matchers',
    ()=>{
        console.log('Testing range matcher:',rangeMatcher.toString().substr(0,500),'...')
        console.log('That was big!')
        //console.log(rangeMatcher)
        let m = '4 - 6'.match(rangeMatcher);
        expect(m).toBeTruthy()
        expect(m.groups.first).toEqual('4')
        expect(m.groups.second).toEqual('6')
        m = '1 to 2'.match(rangeMatcher);
        expect(m).toBeTruthy()
        expect(m.groups.first).toEqual('1')
        expect(m.groups.second).toEqual('2')
        m = '1 1/2 to 3'.match(rangeMatcher);
        expect(m).toBeTruthy()
        expect(m.groups.first).toEqual('1 1/2')
        expect(m.groups.second).toEqual('3')
        m = 'three to four'.match(rangeMatcher);
        expect(m).toBeTruthy()
        expect(m.groups.first).toEqual('three')
        expect(m.groups.second).toEqual('four')
        m = 'twelve to seventeen'.match(rangeMatcher);
        expect(m).toBeTruthy()
        expect(m.groups.first).toEqual('twelve')
        expect(m.groups.second).toEqual('seventeen')

    }
);

it(
    'Words to numbers',
    ()=>{
        expect(frac_to_float('two')).toEqual(2);
        expect(frac_to_float('three')).toEqual(3);
        expect(frac_to_float('a half')).toEqual(0.5);
        expect(frac_to_float('nine')).toEqual(9);
        expect(frac_to_float('ten')).toEqual(10);
        expect(frac_to_float('seventeen')).toEqual(17);
        expect(frac_to_float('thirtyseven')).toEqual(37);
        expect(frac_to_float('twenty four')).toEqual(24);
        expect(frac_to_float('forty-eight')).toEqual(48);
        expect(frac_to_float('ninety-two')).toEqual(92);
    }
);

it(
    'Float to frac',
    ()=>{
        expect(float_to_frac(0.5)).toEqual('\u00BD')
        expect(float_to_frac(0.5,{unicodeFractions:false})).toEqual('1/2')
    },
);
it(
    'Frac to float',
    ()=>{
        expect(frac_to_float('2/3')).toBeCloseTo(0.666)
        expect(frac_to_float('5 2/3')).toBeCloseTo(5.666)
        expect(frac_to_float('2/')).toBeNaN()
    },
);
it(
    'Increment',
    ()=>{
        expect(increment(0.333)).toBeCloseTo(0.666)
        expect(increment(0.25)).toBeCloseTo(0.5)
        expect(increment(1.25)).toBeCloseTo(1.5)
        expect(increment(1.33)).toBeCloseTo(1.666)
    },
);
it(
    'Decrement',
    ()=>{
        expect(decrement(0.666)).toBeCloseTo(0.333)
        expect(decrement(0.5)).toBeCloseTo(0.333)
        expect(decrement(0.333)).toBeCloseTo(0.25)
        expect(decrement(1.75)).toBeCloseTo(1.5)
        expect(decrement(1.666)).toBeCloseTo(1.333)

    },
);

it(
    'parse_amount',
    ()=>{
        let a = parse_amount('1 1/2 cups');
        expect(a.amount).toEqual(1.5);
        expect(a.posttext).toEqual(' cups');
        a = parse_amount('2 cups');
        expect(a.amount).toEqual(2)
        expect(a.posttext).toEqual(' cups')
        a = parse_amount('2 to 3 cups');
        expect(a.amount).toEqual(3)
        expect(a.rangeAmount).toEqual(2)
        expect(a.posttext).toEqual(' cups')
        a = parse_amount('about 2 1/2 to four pints');
        expect(a.rangeAmount).toEqual(2.5)
        expect(a.amount).toEqual(4)
        expect(a.pretext).toEqual('about ')
        expect(a.posttext).toEqual(' pints')
        a = parse_amount('maybe ten or twelve eggs');
        expect(a.rangeAmount).toEqual(10)
        expect(a.amount).toEqual(12)
        expect(a.pretext).toEqual('maybe ')
        expect(a.posttext).toEqual(' eggs')
        a = parse_amount('three dozen chicken');
        expect(a.amount).toEqual(3)
        expect(a.posttext).toEqual(' dozen chicken');

    }
);
