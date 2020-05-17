import sampleParse from './parseData.js';
import {parseChunks,handleChunk} from './importer.js';
import RecDef from '../common/RecDef.js';
it(
    'Simple Chunks',
    ()=>{
        let recipe = {}
        let result = handleChunk({
            tag:'title',text:'    A   title    ',
            html:'<span>   A title      </span>',
        },undefined,recipe);
        expect(recipe.title).toEqual('A title');
        result = handleChunk({
            tag:'title',text:'  and a      subtitle as well?',
            html:'<p>and a subtitle <br> as  <br>  well',
        },undefined,recipe);
        expect(recipe.title).toEqual('A title and a subtitle as well?');
    }
);

it(
    'Sources',
    ()=>{
        let recipe = {sources:[]}
        let localContext = handleChunk({
            tag:'source',text:'Mark Bittman',
            html:'<a href="http://www.markbittman.com/">Mark Bittman</a>',
        },undefined,recipe
                                      );
        expect(localContext).toEqual(
            expect.objectContaining({
                    tag:'source',
                    value:{
                        name:'Mark Bittman',
                        url:'http://www.markbittman.com/'
                    }
            })
        );
        expect(recipe.sources[0]).toEqual(
            expect.objectContaining(
                {
                    name:'Mark Bittman',
                    url:'http://www.markbittman.com/'
                }
            )
        );

        handleChunk({
            tag:'source',text:'Alton Brown - www.altonbrown.com',
            html:'<span>Alton Brown - www.altonbrown.com</span>',
        },
                                        undefined,recipe);
        expect(recipe.sources[1]).toEqual(
            expect.objectContaining(
                {
                    name:'Alton Brown',
                    url:'//www.altonbrown.com'
                }
            )
        );
        handleChunk({
            tag:'source','html':'<a href="/authors/joe">Joe</a>',
            text:'Joe',
        },
                    {url:'https://www.recipe.com/'},
                    recipe);
        expect(recipe.sources[2]).toEqual(
            expect.objectContaining(
                {
                    name:'Joe',
                    url:'https://www.recipe.com/authors/joe'
                }
            )
        );
    }
);

it(
    'Yields & Times',
    ()=>{
        let recipe = {yields:[],times:[]}
        handleChunk({
            tag:'yields',
            text:'3 servings',
        },
                    {url:'https://www.recipe.com/'},
                    recipe);
        expect(recipe.yields[0]).toEqual(
            expect.objectContaining({
                amount:3,
                unit:'servings'
            })
        );
        handleChunk({
            tag:'time',
            text:'30 minutes',
        },
                    {url:'https://www.recipe.com/'},
                    recipe);
        expect(recipe.times[0]).toEqual(
            expect.objectContaining({
                text:'30 minutes',
                seconds:30*60,
                label:'Time'
            })
        );

        handleChunk({
            tag:'time',
            text:'Total time 1 1/2 hours',
        },
                    {url:'https://www.recipe.com/'},
                    recipe);
        expect(recipe.times[1]).toEqual(
            expect.objectContaining({
                text:'Total time 1 1/2 hours',
                seconds:60*60*1.5,
                label:'Total Time'
            })
        );



    }
);


xit(
    'Full Sample Recipe',
    ()=>{
        let result = parseChunks(sampleParse,{url:'https://cooking.nytimes.com/recipes/1020045-coconut-miso-salmon-curry'})
        console.log('Got result: ',result);
        expect(result).toEqual(
            expect.objectContaining({
                ingredients : expect.any(Array),
                text : expect.any(Array)
            })
        );
    }
);

