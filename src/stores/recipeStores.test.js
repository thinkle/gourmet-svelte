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
        
import { tick } from "svelte";
import { get } from 'svelte/store';

beforeAll(
    async () => {
        mockLambdaFunction(user);
        user.fake(mockUser);
    }
);

it(
    'Connection to mocks works :)',
    async ()=>{
        // first subscriber triggers connection
        get(connected); 
        // wait one tick for the connection to happen
        await tick(); 
        // expect it to happen
        expect(get(connected)).toBe(true) 
    }
);


describe(
    'Starting with an empty database',
    ()=>{
        beforeAll(
            async ()=>{
                get(connected); 
                await tick();
                await setupEmptyDB(user)
            }
        );

        it(
            'Create a new recipe!',
            async ()=>{
                await recipeActions.createRecipe(testRecs.standard)
                await tick()
                let id = get(recipeActionGeneralState).created;
                expect(id).toBeDefined()
                await tick();
                let loc = get(localRecipes)[id]
                let stored = get(storedRecipes)[id]
                expect(loc).toBeDefined()
                expect(stored).toBeDefined()
                expect(loc.title).toEqual(stored.title);
                expect(loc.title).toEqual(testRecs.standard.title);
            }
        );

    }
);

describe(
    'Starting with data in the database',
    ()=>{
        beforeAll(
            async ()=>{
                get(connected);
                await tick();
                await setupDBwithRecs(user)
            }
        );


        it(
            'Syncing grabs new recipes',
            
            async ()=>{
                await recipeActions.doSync(true); // test mode -- just a few
                await tick();
                let current = get(storedRecipes);
                expect(current).toBeDefined();
                expect(Object.keys(current).length).toBeGreaterThan(10);
            }
        );

        xit(
            'Opening and editing recipe updates state correctly',

            async ()=> {
                await recipeActions.doSync(true); // test mode -- just a few
                await tick();
                let current = get(storedRecipes);
                expect(current).toBeDefined();
                expect(Object.keys(current).length).toBeGreaterThan(5);
                await tick();
                let page = get(recipePage)
                await tick();
                expect(page).toBeDefined()
                expect(page.length).toBeGreaterThan(5);
                let recs = get(storedRecipes);
                let rec1 = page[0];
                let rec2 = page[1];
                console.log('got recs',rec1,rec2);
                let openRec = await localRecipes.open(rec1.id);
                let openRec2 = await localRecipes.open(rec2.id);
                let localRecs = get(localRecipes);
                expect(localRecs).toBeDefined()
                let localCopy = localRecs[rec1.id];
                localCopy.title += 'Foo'; // change the title
                // We have made a change to the object...
                localRecipes.update(
                    $localRecipes=>$localRecipes
                );
                let recState = get(recipeState);
                expect(recState[rec1.id].edited).toBeTruthy()
                expect(recState[rec2.id].edited).toBeFalsy()
            }
        );
    }    
);
