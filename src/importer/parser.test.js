// Full test framework to go from parsing to import...

import tagger from '../extension/parser/tagger.js';
import Parser from '../extension/parser/recipeParser.js';
import {files} from '../common/mocks/importPages/';
import {parseChunks} from './importer.js';


function getResults (page='simple.html',domain) {
    console.log('files are',Object.keys(files));
    const readDocument = new DOMParser().parseFromString(files[page],'text/html')
    document.body = readDocument.body
    if (domain) {
        console.log('Set domain',domain);
        document.domain = domain
    }
    let parser = Parser(tagger)
    console.log('AUTOPARSE!');
    parser.auto_parse();
    return parser.results
}

it(
    'Read a test recipe',
    ()=>{
        let results = getResults()
        expect(results).toBeDefined()
        expect(results.length).toBeGreaterThan(1)
        let parsed = parseChunks(results);
        console.log(parsed)
    }
);

fit(
    'Schema.org recipe',
    ()=>{
        let results = getResults('schema.html');
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(1)
        let parsed = parseChunks(results);
        expect(parsed.times.length).toEqual(2)
        expect(parsed.times[0].seconds).toEqual(900)
        expect(parsed.times[1].seconds).toEqual(3600)
        expect(parsed.yields).toBeDefined()
        expect(parsed.yields.length).toEqual(1)
        expect(parsed.yields[0].amount).toEqual(1)
        expect(parsed.yields[0].unit).toEqual('loaf')
        expect(parsed.ingredients).toBeDefined()
        expect(parsed.ingredients.length).toEqual(3)
        expect(parsed.ingredients[0].amount.amount).toEqual(4)
        expect(parsed.ingredients[0].amount.rangeAmount).toEqual(3)
        expect(parsed.ingredients[0].text).toEqual('ripe bananas, smashed')
        expect(parsed.ingredients[1].text).toEqual('egg')
        expect(parsed.ingredients[2].text).toMatch(/sugar/)
        expect(parsed.ingredients[2].amount.amount).toEqual(0.75)
        expect(parsed.ingredients[2].amount.unit).toEqual('cup')
    }
);

it(
    'Ingredient groups',
    ()=>{
        for (let variant of ['simpleGroups.html','simpleGroups-flat.html']) { 
            let results = getResults(variant);
            expect(results.length).toBeGreaterThan(2)
            expect(results.filter((c)=>c.tag=='inggroup').length).toBeGreaterThan(0)
            let parsed = parseChunks(results);
            //console.log('parsed:',parsed)
            expect(parsed.ingredients.length).toEqual(2)
            expect(parsed.ingredients[0].ingredients.length).toEqual(4)
            expect(parsed.ingredients[1].ingredients.length).toEqual(2)
            expect(parsed.ingredients[0].text).toMatch(/for the bread/i)
            expect(parsed.ingredients[1].text).toMatch(/to serve/i)
            expect(parsed.ingredients[0].ingredients[0].amount.amount).toEqual(3)
            expect(parsed.ingredients[0].ingredients[0].text).toMatch(/bananas/i)
            expect(parsed.ingredients[0].ingredients[1].text).toMatch(/flour/i)
            expect(parsed.ingredients[0].ingredients[3].text).toMatch(/oil/i)
            expect(parsed.ingredients[1].ingredients[0].text).toMatch(/powdered sugar/i)
            expect(parsed.ingredients[1].ingredients[1].text).toMatch(/whipped cream/i)
        }
    }
);

xit(
    'Cooks illustrated',
    ()=>{
        let results = getResults('cooksIllustrated.html','cooksillustrated.com');
        // get domain thing working?
        let parsed = parseChunks(results);
        console.log('CI parsed: ',parsed);
    }
);


it(
    'Foodnetwork - one that gets blank space',
    ()=>{
        let results = getResults('foodNetwork.html');
        let parsed = parseChunks(results);
        console.log(parsed);
    }
);
