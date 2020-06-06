
import {nytExample,poorlyTagged} from './parseData.js';
import {parseData,parseChunks,handleChunk,findChildren} from './importer.js';
import RecDef from '../common/RecDef.js';

it(
    'Find Children',
    ()=>{
        expect(()=>findChildren([])).not.toThrow();
        let nodes = ['01-02','01-02-1','01-02-03'].map((n,i)=>({id:i,address:n,children:[]}));
        findChildren(nodes);
        expect(nodes[0].children.length).toEqual(2)
        expect(nodes[1].children.length).toEqual(0)
        expect(nodes[2].children.length).toEqual(0)
        console.log('Paresed first nodes:',nodes);
        console.log('Pass?');
        nodes = ['02-03-01','02-03-01-01','02-03-01-02',
                 '02-03-02',
                 '02-03-03','02-03-03-07'
                ].map((n,i)=>({id:i,address:n,children:[]}));
        findChildren(nodes);
        console.log('Parsed second nodes:',nodes);
        expect(nodes[0].children.length).toEqual(2);
        expect(nodes[0].children[0]).toEqual(1);
        expect(nodes[3].children.length).toEqual(0)
        expect(nodes[4].children.length).toEqual(1);
        nodes = [{address:'foo',id:1},{id:2}]
        expect(()=>findChildren(nodes)).not.toThrow()
    }
);

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
        },{},recipe
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
                    {},recipe);
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
                name:'Time'
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
                name:'Total Time'
            })
        );

        handleChunk({
            address: "00001-00001-00005-00001-00000-00001-00001-00081-00003-00001-00002-00000-00000",
            children: [],
            detail: "Cook Time",
            html: '<time class="cookbook-element-wrapper cookbook-element-wrapper-total-time" itemprop="totalTime" datetime="PT1H25M"><span class="cookbook-element-content cookbook-element-content-total-time"><span class="cookbook-time-value cookbook-time-value-hours">1</span> <span class="cookbook-time-label cookbook-time-label-hours">hour</span>, <span class="cookbook-time-value cookbook-time-value-minutes">25</span> <span class="cookbook-time-label cookbook-time-label-minutes">mins</span></span></time>',
            id: "oiweras05",
            tag: "time",
            text: "1 hour, 25 mins",
        },{},recipe);
        console.log('Got recipe times:',recipe.times)
        expect(recipe.times.length).toEqual(3);
        expect(recipe.times[2]).toEqual(
            expect.objectContaining({
                text:'1 hour, 25 mins',
                seconds:85*60,
                name:'Cook Time'
            })
        );



    }
);

it(
    'Images',
    ()=>{
        let recipe = {images:[]}
        handleChunk(
            {"id":"oiweras0232","html":"<div class=\"media-container \">\n <img src=\"https://static01.nyt.com/images/2019/10/09/dining/lh-roasted-fish-with-cherry-tomatoes/merlin_159811149_9e520eb6-31c2-44fa-aba8-bcc56a2eb34c-articleLarge.jpg\" data-pin-media=\"https://static01.nyt.com/images/2019/10/09/dining/lh-roasted-fish-with-cherry-tomatoes/merlin_159811149_9e520eb6-31c2-44fa-aba8-bcc56a2eb34c-verticalTwoByThree735.jpg\" alt=\"One-Pan Roasted Fish With Cherry Tomatoes\">\n\n <p class=\"image-credit\">\n Andrew Purcell for The New York Times. Food Sylist: Barrett Washburne.\n </p>\n </div>","tag":"image","text":"\n \n\n \n Andrew Purcell for The New York Times. Food Sylist: Barrett Washburne.\n \n ","address":"00002-00013-00005-00001-00001-00001-00003-00001"},{url:'https://cooking.nytimes.com/recipes/1020454-one-pan-roasted-fish-with-cherry-tomatoes?algo=cooking_vanilla&fellback=false&imp_id=688303451&action=click&module=RecirculationRibbon&pgType=recipedetails&rank=2'},
            recipe
        );
        expect(recipe.images.length).toEqual(1);
        expect(recipe.images[0].url).toEqual('https://static01.nyt.com/images/2019/10/09/dining/lh-roasted-fish-with-cherry-tomatoes/merlin_159811149_9e520eb6-31c2-44fa-aba8-bcc56a2eb34c-articleLarge.jpg');        
        expect(recipe.images[0].alt).toEqual('One-Pan Roasted Fish With Cherry Tomatoes');        
    }
);

it(
    'Full sample recipe with groups and nestedness and stuff',
    ()=>{
        console.log('full sample full full fullgroups and stuff!');
        let result = parseData(nytExample);
        console.log('Ingredients are:',
                    result.ingredients.map((i)=>JSON.stringify(i))
                   )
    }
    
);


fit(
    'Handle ugly data with duplicates and nesting',
    ()=>{
        let result = parseData(poorlyTagged);
        expect(result.text.length).toEqual(1); // don't import all the nested text tags as duplicates
        expect(result.text[0].header).toEqual('How to Make This Recipe');
        let firstIng = result.ingredients[0];
        console.log('got ing',firstIng);
        expect(firstIng.amount).toBeDefined();
        expect(firstIng.amount.amount).toEqual(1);
        expect(firstIng.amount.unit).toEqual('pound');
        expect(firstIng.text).toMatch(/dry pasta/)
        console.log(result.ingredients)
        let secondIng = result.ingredients[1]; // don't double-import ingredients - second one should be right...
        expect(secondIng.text).toMatch(/yellow/) // yellow bell pepper is #2 :)
        console.log('Got result: ',result);
        expect(result.text[0].body).not.toMatch(/googlesyndication.com/) // make sure we stripped out the ad
    }
);
