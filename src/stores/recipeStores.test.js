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
        console.log('Connecting to MONGO_URL?',process.env.MONGO_URL)
        mockLambdaFunction(user);
        user.fake(mockUser);
    }
);

it(
    'Connection to mocks works :)',
    async ()=>{
        await tick();
        expect(get(connected)).toBe(true)
        user.fake(mockUser);
    }
);


describe(
    'Starting with an empty database',
    ()=>{
        beforeAll(
            async ()=>{
                await setupEmptyDB(user)
            }
        );

        it(
            'Create a new recipe!',
            async ()=>{
                get(connected);
                await tick();
                await recipeActions.createRecipe(testRecs.standard)
                await tick()
                let id = get(recipeActionGeneralState).created;
                expect(id).toBeDefined()
                console.log('Created ID',id);
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
                console.log('Setting up recipes for',user);
                await setupDBwithRecs(user)
            }
        );


        it(
            'Syncing grabs new recipes',
            
            async ()=>{
                await recipeActions.doSync();
                await tick();
                let current = get(storedRecipes);
                expect(current).toBeDefined();
                expect(Object.keys(current).length).toBeGreaterThan(10);
                console.log(
                    jsonConcisify(current)
                );
            }
        );
    }    
);
