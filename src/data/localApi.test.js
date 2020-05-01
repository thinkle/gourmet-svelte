import api from './localApi';
import "fake-indexeddb/auto";
import user from "../common/mocks/user.js"
import {testRecs} from "../common/mocks/recipes.js"

it('connect to db',async () => {
    await api.connect()
    expect(api.db).toBeDefined()
});

it('Store and retrieve a recipe',async () => {
    await api.connect();
    const recid = await api.addRecipe(testRecs.standard,user.id);
    const readRec = await api.getRecipe(recid,user.id);
    expect(recid).toEqual(1)
    expect(readRec.title).toEqual(testRecs.standard.title)
    expect(readRec.ingredients.length).toEqual(testRecs.standard.ingredients.length)
    expect(readRec.ingredients[0].item).toEqual(testRecs.standard.ingredients[0].item)    
});

it('Store multiple recs',async () => {
    await api.connect();
    await api.addRecipe(testRecs.standard,user.id);
    await api.addRecipe(testRecs.standard,user.id);
    await api.addRecipe(testRecs.standard,user.id);
    let resp = await api.getRecipes(undefined,user.id);
    expect(resp.result.length).toBeGreaterThan(2);
});

it('Update recipe',async () => {
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
