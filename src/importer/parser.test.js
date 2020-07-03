// Full test framework to go from parsing to import...

import tagger from '../extension/parser/tagger.js';
import Parser from '../extension/parser/recipeParser.js';
import {files} from '../common/mocks/importPages/';
import {parseChunks} from './importer.js';


function getResults (page='simple.html') {
    console.log('files are',Object.keys(files));
    const readDocument = new DOMParser().parseFromString(files[page],'text/html')
    document.body = readDocument.body
    let parser = Parser(tagger)
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
        console.log('RESULTS:',results.filter((c)=>true||c.tag=='time'))
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
