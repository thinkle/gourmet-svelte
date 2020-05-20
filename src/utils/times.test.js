import times from './times.js';


it(
    'Time matcher',
    ()=>{
        expect(times.getTimeUnit('20 seconds')).toEqual(1)
        expect(times.getTimeUnit('a minute')).toEqual(60)
        expect(times.getTimeUnit('three hours')).toEqual(60*60);
    }
);


it(
    'Time matcher',
    ()=>{
        expect(times.getTimeUnit('20 seconds')).toEqual(1)
        expect(times.getTimeUnit('a minute')).toEqual(60)
        expect(times.getTimeUnit('three hours')).toEqual(60*60);
    }
);

it(
    'Time regexp',
    ()=>{
        console.log('Simple matcher: ',times.timeMatcher);
        console.log('Named matcher: ',times.timeValueMatcher);
        expect('3 hours 5 minutes'.match(times.timeMatcher)).toBeDefined();
        expect('3 hours 5 minutes'.match(times.fancyTimeMatcher)).toBeDefined();
        console.log('dogs and cats'.match(times.timeMatcher));
        expect('dogs and cats'.match(times.timeMatcher)).toBeNull()
        expect(times.getSecondsFromString('1 minute and 2 seconds')).toEqual(62)
        expect(times.getSecondsFromString('2 minutes 42 seconds')).toEqual(120+42)
        expect(times.getSecondsFromString('1 hour 2 minutes 42 seconds')).toEqual(60*60+120+42)
        expect(
            '3 hours 2 minutes 1 second'.replace(times.timeMatcher,'z')
        ).toEqual('z');   
        expect(
            '3 hours 2 minutes blah blah 2 minutes 1 seconds'
                .replace(times.timeMatcher,
                         'z')
        ).toMatch(
            /z\s*blah blah\s*z/
        );
        expect(
            times.parseTimes('3 hours 2 minutes AND THEN 1 minute')
        ).toEqual(
            `<duration seconds=${3*60*60+2*60}>3 hours 2 minutes</duration> AND THEN <duration seconds=60>1 minute</duration>`
        );
        expect(
            times.parseTimes('3 hours, 2 minutes AND THEN 1 minute and 1 second')
        ).toEqual(
            `<duration seconds=${3*60*60+2*60}>3 hours, 2 minutes</duration> AND THEN <duration seconds=61>1 minute and 1 second</duration>`
        );
        expect(
            times.parseTimes('1 hour\ncat\n1 minute')
        ).toEqual(
            `<duration seconds=${60*60}>1 hour</duration>\ncat\n<duration seconds=60>1 minute</duration>`
        );
    }
);
