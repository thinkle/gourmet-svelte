import times from './times.js';


it(
    'getDescription (Time to string)',
    ()=>{
        expect(times.getDescription(30)).toMatch('30 seconds')
        expect(times.getDescription(30*60)).toMatch('30 minutes')
        expect(times.getDescription(90*60)).toMatch('1 ½ hours')
        expect(times.getDescription(95*60)).toMatch('1 hour 35 minutes')
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
            `<duration timestring='3 hours 2 minutes AND THEN 1 minute' seconds=${3*60*60+2*60}>3 hours 2 minutes</duration> AND THEN <duration timestring='AND THEN 1 minute' seconds=60>1 minute</duration>`
        );
        expect(
            times.parseTimes('3 hours, 2 minutes AND THEN 1 minute and 1 second')
        ).toMatch(
            `seconds=${3*60*60+2*60}>3 hours, 2 minutes</duration>`
        );
        expect(
            times.parseTimes('1 hour\ncat\n1 minute')
        ).toEqual(
            `<duration timestring='1 hour\ncat\n1 minute' seconds=${60*60}>1 hour</duration>\ncat\n<duration timestring='cat\n1 minute' seconds=60>1 minute</duration>`
        );
    }
);

it(
    'Expect browser not to crash',
    ()=>{
        let devilText =  ` <div class="topnote">
                <p>Harissa paste, the Tunisian hot chile condiment, is a super versatile pantry item. Keep it on hand for creating quick weeknight sauces that pack a punch. Here, store-bought harissa is reinforced with sautéed onion and garlic, then brightened with lemony coriander and fresh parsley. Mashed chickpeas add texture and balance out the spicy, tangy sauce. Couscous and orzo are simple sides to serve with this meal; if you have extra time, roasted squash or steamed cauliflower are also great accompaniments. Leftover harissa sauce makes a great topping for roasted cod or salmon, or use it as a warm vinaigrette to dress up a simple green salad. If you'd like, you can use boneless breasts or thighs, but keep on eye on them. They'll be cooked through in 20 to 30 minutes.</p>
                


              </div>`
        console.log('Crashing browser?');
        //let array = [...devilText.matchAll(times.timeMatcher)];
        //let one = devilText.match(times.timeMatcher)
        console.log('The regexp: ',times.timeMatcher);
        //console.log('Got matches for devil: ',one);
        let result = times.parseTimes(
        devilText
        );
        console.log('Got result!',result);

    })

it(
    'Extract times',
    ()=>{
        let result = times.extractTimes('Hello world. Bake for 30 minutes. Then stir for 10 seconds. Then eat for at least 2 hours.');
        console.log('Got result',result);
        expect(result.length).toEqual(3);
        expect(result[0].seconds).toEqual(30*60)
        expect(result[1].seconds).toEqual(10)
        expect(result[2].seconds).toEqual(60*60*2)
        expect(result[0].text).toEqual('30 minutes')
        expect(result[0].sentence).toEqual('Bake for 30 minutes.');
    }
);

it(
    'Extract multiple times in a sentence',
    ()=>{
        let result = times.extractTimes('You should bake it 45 minutes and then let it cool for 10 minutes on the counter.');
        expect(result.length).toEqual(2);
        expect(result[0].seconds).toEqual(45*60);
        console.log('result:',result)
    }
);
       
