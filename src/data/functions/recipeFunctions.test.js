import deepcopy from 'deepcopy';
import recipeFunctions from './recipeFunctions.js';
import {testRecs} from '../../common/mocks/recipes.js';
import user,{otherUser} from '../../common/mocks/user.js';
let event = {};
let context = {}

let bp = [event,context,user] // boilerplate lambda function mumbo jumbo
console.log('Connecting to URL?',process.env.MONGO_URL)
it(
    "add recipe returns new _ID. Get Recipe returns that recipe",
    async ()=> {
        let recipe = await recipeFunctions.addRecipe(...bp,{
            recipe:deepcopy(testRecs.standard)
        });
        expect(recipe).toBeDefined();
        expect(recipe._id).toBeDefined();
        expect(recipe.user).toBeDefined();
        expect(recipe.user).toEqual(user.email)
        console.log('Created ID',recipe._id)
        expect(recipe.title).toEqual(testRecs.standard.title);
        expect(recipe.ingredients.length).toEqual(testRecs.standard.ingredients.length);
        let fetchedRec = await recipeFunctions.getRecipe(
            ...bp,
            {_id:recipe._id}
        );
        expect(fetchedRec.title).toEqual(testRecs.standard.title);
        expect(fetchedRec.localid).toEqual(testRecs.standard.localid);
        expect(fetchedRec._id).toEqual(recipe._id);
    }
)

it(
    'updateRecipe',
    async ()=> {
        let r = deepcopy(testRecs.standard)
        let recipe = await recipeFunctions.addRecipe(...bp,{recipe:r});
        recipe.ingredients.push(
            testRecs.testIngredient
        );
        recipe.ingredients.push(
            testRecs.testIngredient
        );
        recipe.title += ' test change'
        let modifiedRecipe = await recipeFunctions.updateRecipe(...bp,
                                                              {recipe});
        expect(modifiedRecipe._id).toEqual(recipe._id);
        expect(modifiedRecipe.title).toEqual(testRecs.standard.title+' test change');
        expect(modifiedRecipe.ingredients.length).toBeGreaterThan(
            testRecs.standard.ingredients.length
        );
    }
);

it(
    "enforce user's only modify own data",
    async () => {
        let rec = await recipeFunctions.addRecipe(...bp,{recipe:{title:'Private Recipe'}});
        expect(async ()=>await recipeFunctions.getRecipe(...bp,{_id:rec._id}))
            .not
            .toThrowError();
        let threwError = false;
        try {
            console.log('this should fail...');
            let stolenRec = await recipeFunctions.getRecipe(event,context,otherUser,
                                                            {_id:rec._id});
            console.log('I stole the cookie jar: ',stolenRec);
        }
        catch (err) {
            threwError = err;
            expect(err.message).toMatch(/no recipe/i)
        }
        expect(threwError).toBeTruthy()
        threwError = false;
        try {
            let muckedUpRec = await recipeFunctions.updateRecipe(
                event,context,otherUser,
                {recipe:rec}
            );
        }
        catch (err) {
            threwError = true;
        }
        expect(threwError).toBeTruthy();
        let deletedOtherPersonsRecipes = await recipeFunctions.deleteRecipe(
            event,context,otherUser,
            {recipe:rec}
        );
        expect(deletedOtherPersonsRecipes).toEqual(0)
    }
);

it(
    'delete recipe',
    async () => {
        let rec = await recipeFunctions.addRecipe(...bp,{recipe:{title:'Private Recipe'}});
        let id = rec._id;
        let gotItBack = await recipeFunctions.getRecipe(...bp,{_id:id});
        expect(gotItBack._id).toEqual(id);
        console.log('Got back recipe!',gotItBack);
        let deleteCount = await recipeFunctions.deleteRecipe(...bp,{recipe:{_id:id}});
        expect(deleteCount).toEqual(1)
        let threwError = false;
        try {
            let backFromTheDead = await recipeFunctions.getRecipe(...bp,{_id:id});
        } catch (err) {
            threwError = true;
            expect(err.message).toMatch(/no recipe/i)
        }
        expect(threwError).toBeTruthy();
    }
);

it(
    'pagination and search',
    async () => {
        expect('me').toEqual('have implemented this');
);
