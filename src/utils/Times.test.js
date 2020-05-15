import Times from './Times.js';

it(
    'Time matcher',
    ()=>{
        expect(Times.getTimeUnit('20 seconds')).toEqual(1)
        expect(Times.getTimeUnit('a minute')).toEqual(60)
        expect(Times.getTimeUnit('three hours')).toEqual(60*60);
    }
);
