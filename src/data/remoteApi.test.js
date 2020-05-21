import jestFetchMocks from 'jest-fetch-mock'
jestFetchMocks.enableMocks()
import {RecipeApi} from './remoteApi.js'
import {testRecs} from "../common/mocks/recipes.js"
import user from "../common/mocks/user.js"

let api = RecipeApi(user);

// Note: Mocking this seems a little dumb since it works kind of
// perfectly... might make more sense to mock this API in UI testing
// later or something?
//
// Also, probably worth more effort to mock the MongoDB side of things
// and then right tests for our lambda functions themselves.

it (
    'loads file at all?',
    ()=>{
        console.log('Hello world with no error???');
        
    }
)

it('connect to db',async () => {
    await api.connect()
});

it('Store and retrieve a recipe',async () => {
    await api.connect();
    fetch.mockResponseOnce(
        JSON.stringify({
            ...testRecs.standard,
            _id : 'asdofiasdaieraw0e9r8awera'
        })
    );
    const recipe = await api.addRecipe({...testRecs.standard});
    expect(recipe._id).toBeDefined()
    expect(recipe.id).toEqual(testRecs.standard.id);
    fetch.mockResponseOnce(
        JSON.stringify({
            ...testRecs.standard,
            _id : 'asdofiasdaieraw0e9r8awera'
        })
    );
    const readRec = await api.getRecipe(recipe.id);
    expect(readRec).toBeDefined();
    expect(readRec.title).toEqual(testRecs.standard.title)
    expect(readRec.ingredients.length).toEqual(testRecs.standard.ingredients.length)
    expect(readRec.ingredients[0].item).toEqual(testRecs.standard.ingredients[0].item)    
});

xit('Store multiple recs',async () => {
    await api.connect();
    delete testRecs.standard.localid
    delete testRecs.standard.id
    await api.addRecipe({...testRecs.standard});
    await api.addRecipe({...testRecs.standard});
    await api.addRecipe({...testRecs.standard});
    let resp = await api.getRecipes(undefined);
    expect(resp.result.length).toBeGreaterThan(2);
});

xit('Update recipe',async () => {
    await api.connect();
    let r = {...testRecs.standard}
    let rid = await api.addRecipe(testRecs.standard,user.id);
    r.title = 'Updated '+r.title;
    r.id = rid;
    let r2 = await api.updateRecipe(r,user.id);
    expect(r2).toEqual(rid);
    let rfresh = await api.getRecipe(rid,user.id);
    expect(rfresh.title).not.toEqual(testRecs.standard.title);
    expect(rfresh.title.substr(0,7)).toEqual('Updated');
});
