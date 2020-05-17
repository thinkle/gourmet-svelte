import {getAngle,deg} from './trigHelper.js';

it(
    'Trig helpers work right?',
    ()=>{
        expect(deg(getAngle(10,0))).toEqual(0)
        expect(deg(getAngle(10,10))).toEqual(45)
        expect(deg(getAngle(0,10))).toEqual(90)
        expect(deg(getAngle(-10,0))).toEqual(180)
        expect(deg(getAngle(-10,10))).toEqual(135)
        expect(deg(getAngle(-10,-10))).toEqual(225)
        expect(deg(getAngle(0,-10))).toEqual(270)
        expect(deg(getAngle(10,-10))).toEqual(315)
    }
)
