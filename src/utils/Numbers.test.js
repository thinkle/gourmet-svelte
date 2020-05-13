import {float_to_frac, frac_to_float, numberMatcher, numMatchString, increment, decrement} from './Numbers.js'

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
