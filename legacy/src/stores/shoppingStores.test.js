// Mocks...
import 'mock-local-storage';
import jestFetchMocks from 'jest-fetch-mock'
jestFetchMocks.enableMocks()
import indexedDB from 'fake-indexeddb';
import IDBKeyRange from"fake-indexeddb/lib/FDBKeyRange";
import {testRecs} from "../common/mocks/recipes.js"
import mockUser from "../common/mocks/user.js"
import {mockLambdaFunction} from '../data/functions/mockFunction.js';
import {setupEmptyDB,setupDBwithRecs} from '../data/functions/setupMockDB.js'
import deepcopy from 'deepcopy';
import {jsonConcisify} from '../utils/textUtils.js';
import {user} from './user.js';
import {connected,localRecipes,openLocalRecipes,storedRecipes,recipePage,recipeActions,recipeState,recipeActionState,recipeActionGeneralState} from './recipeStores.js';
import {shoppingList, storedShopRec} from './shoppingStores.js';

import { tick } from "svelte";
import { get } from 'svelte/store';

beforeAll(
    async () => {
        mockLambdaFunction(user);
        user.fake(mockUser);
        get(connected);
        await tick();
    }
);

async function getUpdatedSL () {
    let sl = await get(shoppingList);
    await tick();
    await Promise.resolve()
    await tick();
    sl = await get(shoppingList);
    await Promise.resolve()
    await tick();
    sl = await get(shoppingList);
    console.log('Got',sl);
    return sl;
}

describe(
    'Starting empty',
    ()=>{
        beforeAll(async()=>{
            await setupEmptyDB(user)
        }
                 );

        xit(
            'Create empty shopping list',
            async ()=>{
                shoppingList.get();
                //let $shoppingList = await getUpdatedSL()
                //expect($shoppingList).toBeDefined()
                //expect($shoppingList.length).toEqual(0);
                //await tick();
                let id = shoppingList.getShoppingRecipeId();
                let $storedRec = get(storedShopRec)
                console.log('Stored Rec?',$storedRec)
                await tick()
                $storedRec = get(storedShopRec)
                console.log('Stored Rec?',$storedRec)
                // Now fetch a second time and expect it to work again...
                shoppingList.get();
                await tick();
                let newId = shoppingList.getShoppingRecipeId();
                expect(id).toEqual(newId);
            }
        );

        it(
            'Add custom item to shopping list',
            async ()=>{
                await shoppingList.get();
                let id = await shoppingList.addItem({amount:{amount:1,unit:'can'},text:'tomatoes'});
                expect(id).toBeDefined()
                let id2 = await shoppingList.addItem({amount:{amount:1,unit:'can'},text:'beans'});
                expect(id).not.toEqual(id2)
                let sl = await getUpdatedSL()
                expect(sl.length).toEqual(2);
            }
        );

        
    }
);

describe(
    'Starting full',
    ()=>{

        beforeAll(async()=>{
            await setupDBwithRecs(user)
            await tick();
            await recipeActions.doSync(true); // test mode -- just a few
            await tick();
        });


        async function getSomeIDs () {
            let recs = await recipeActions.getRecipes();
            await tick();
            let recipeIds = get(recipePage);
            expect(recipeIds).toBeDefined()
            expect(recipeIds.length).toBeGreaterThan(5);
            return recipeIds
        }

        it(
            'Create new shopping list with some recipes in it',
            async () =>{
                await shoppingList.get();
                await shoppingList.clear();
                await tick();
                let sl = await get(shoppingList);
                await tick()
                let shoppingRecID = shoppingList.getShoppingRecipeId();
                expect(shoppingRecID).toBeDefined();
                sl = await get(shoppingList);
                expect(sl.length).toEqual(0)
                let recipeIds = await getSomeIDs()
                await shoppingList.addRecipe(recipeIds[1]);
                sl = await getUpdatedSL()
                expect(sl.length).toBeGreaterThan(1)
                let listLength = sl.length;
                await shoppingList.addRecipe(recipeIds[2]);
                await shoppingList.addRecipe(recipeIds[3]);
                await shoppingList.addRecipe(recipeIds[4]); // add three more recipes...
                sl = await getUpdatedSL()
                expect(sl.length).toBeGreaterThan(listLength);
            }
        );

        it(
            'Delete item from shopping list',
            async () => {
                await shoppingList.get();
                await shoppingList.clear();
                let recipeIds = await getSomeIDs()
                await shoppingList.addRecipe(recipeIds[3]);
                let sl = await getUpdatedSL()
                expect(sl.length).toBeGreaterThan(1)
                shoppingList.removeRecipe(recipeIds[3]);
                sl = await getUpdatedSL()
                expect(sl.length).toEqual(0)
            }
        );

        
    }
);
