import jestFetchMocks from 'jest-fetch-mock'
jestFetchMocks.enableMocks()
import {RecipeApi} from './remoteApi.js'
import {testRecs} from "../common/mocks/recipes.js"
import user from "../common/mocks/user.js"
import {mockLambdaFunction} from './functions/mockFunction.js';
import {setupEmptyDB,setupDBwithRecs} from './functions/setupMockDB.js'
import deepcopy from 'deepcopy';
import {jsonConcisify} from '../utils/textUtils.js';
let api = RecipeApi(user);

beforeAll(
    async ()=>{
        console.log('Connecting to MONGO_URL?',process.env.MONGO_URL)
        mockLambdaFunction(user)
        //await setupDBwithRecs(user)
        await setupEmptyDB(user)
    }
);

// Note: Mocking this seems a little dumb since it works kind of
// perfectly... might make more sense to mock this API in UI testing
// later or something?
//
// Also, probably worth more effort to mock the MongoDB side of things
// and then write tests for our lambda functions themselves.


it('connect to db',async () => {
    await api.connect()
});


it('Get recs',
   async () => {
        mockLambdaFunction(user)
       let response = await api.getRecipes({limit:2});
   }
  );

it('Add rec, get _id, retrieve by _id',
   async () => {
       let recipe = await api.addRecipe(
           deepcopy(testRecs.standard),
       );
       expect(recipe).toBeDefined();
       expect(recipe._id).toBeDefined();
       expect(recipe.owner).toBeDefined();
       expect(recipe.owner.email).toEqual(user.email)
       console.log('Fetched recipe:',jsonConcisify(recipe));
       expect(recipe.title).toEqual(testRecs.standard.title);
       expect(recipe.ingredients.length).toEqual(testRecs.standard.ingredients.length);
       let response = await api.getRecipes({limit:2});
       expect(response.count).toEqual(1);
       console.log('We have recipes:',jsonConcisify(response));
       console.log('Now fetch again?',recipe._id,response.result[0]._id)
       /**
          WTF: For reasons I don't understand, this fetch/retrieve
          business FAILS when passed through the API. To fix it, I had
          to provide an _id from the outset.
          
          Why?

          No fucking clue.

          So now prepRec always puts an ID on a recipe that doesn't
          have one. We bypass MongoDB's own unique ID system, which is
          maybe not so good.
        **/
       // let updatedRec = await api.updateRecipe(recipe);
       // console.log('Udpated:',jsonConcisify(updatedRec));
       // if (JSON.stringify(updatedRec)==JSON.stringify(recipe)) {
       //     console.log('Updated and original are friggin identical')
       // }
       // else {
       //     console.log('Updated and original are different!')
       // }
       let fetchedRec = await api.getRecipe(
            recipe._id
       );
       expect(fetchedRec.title).toEqual(testRecs.standard.title);
       expect(fetchedRec.localid).toEqual(testRecs.standard.localid);
       expect(fetchedRec._id).toEqual(recipe._id);
       
   }
  );

it('Store and retrieve a recipe',
   async () => {
       const recipe = await api.addRecipe({...testRecs.standard});
       expect(recipe._id).toBeDefined()
       //expect(recipe.id).toEqual(testRecs.standard.id);
       expect(recipe.owner.email).toEqual(user.email);
       const readRec = await api.getRecipe(recipe._id);
       expect(readRec).toBeDefined();
       expect(readRec.title).toEqual(testRecs.standard.title)
    // expect(readRec.ingredients.length).toEqual(testRecs.standard.ingredients.length)
       // expect(readRec.ingredients[0].item).toEqual(testRecs.standard.ingredients[0].item)    
   });

it('Store multiple recs',async () => {
    await api.connect();
    delete testRecs.standard.localid
    delete testRecs.standard.id
    await api.addRecipe({...testRecs.standard});
    await api.addRecipe({...testRecs.standard});
    await api.addRecipe({...testRecs.standard});
    let resp = await api.getRecipes(undefined);
    expect(resp.result.length).toBeGreaterThan(2);
});

it('Update recipe',async () => {
    mockLambdaFunction(user)
    await api.connect();
    let r = {...testRecs.standard}
    let rec = await api.addRecipe(testRecs.standard);
    r.title = 'Updated '+r.title;
    r.id = rec.id;
    r._id = rec._id
    let r2 = await api.updateRecipe(r);
    expect(r2.id).toEqual(r.id);
    let rfresh = await api.getRecipe(r._id);
    expect(rfresh.title).not.toEqual(testRecs.standard.title);
    expect(rfresh.title.substr(0,7)).toEqual('Updated');
});
