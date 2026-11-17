import {exporters,exportRecipe} from './index.js';
import {testRecs,standard} from '../common/mocks/recipes.js'


it(
    'Basic export',
    ()=>{
        let vanilla = exportRecipe(standard,'gourmet-json')
        expect(vanilla.title).toEqual(standard.title);
        expect(vanilla.ingredients[0].text).toEqual(standard.ingredients[0].text);
        delete vanilla.images;
        console.log('Vanilla -images: ',vanilla);
    }
);

it(
    'Schema.org export',
    ()=>{
        let json = exportRecipe(standard,'jsonld');
        delete json.image
        console.log('-images, JSON-LD:',json);
    }
);
