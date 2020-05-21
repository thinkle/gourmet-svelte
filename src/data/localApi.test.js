import Dexie from 'dexie';
import indexedDB from 'fake-indexeddb';
import IDBKeyRange from"fake-indexeddb/lib/FDBKeyRange";
import api from './dexieApi.js';
import user from "../common/mocks/user.js"
import {testRecs} from "../common/mocks/recipes.js"

Dexie.dependencies.indexedDB = indexedDB;
Dexie.dependencies.IDBKeyRange = IDBKeyRange

it('connect to db',async () => {
    await api.connect()
    expect(api.db).toBeDefined()
});

it('Store and retrieve a recipe',async () => {
    await api.connect();
    expect(api.db).toBeDefined()
    expect(api.db.recipes).toBeDefined()
    //delete testRecs.standard.id
    const recid = await api.addRecipe(testRecs.standard);
    console.log('Created rec with ID',recid);
    const readRec = await api.getRecipe(recid);
    expect(recid).toBeDefined()
    expect(readRec).toBeDefined();
    expect(readRec.title).toEqual(testRecs.standard.title)
    expect(readRec.ingredients.length).toEqual(testRecs.standard.ingredients.length)
    expect(readRec.ingredients[0].item).toEqual(testRecs.standard.ingredients[0].item)    
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
