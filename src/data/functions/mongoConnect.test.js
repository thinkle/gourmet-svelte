import {loadDB} from './mongoConnect.js';
import setupHandler from './setupDB.js';
import {user,event,context,setupDBwithRecs,setupEmptyDB} from './testUtils.js';

it(
    'Connect to MongoDB',
    async ()=>{
        console.log('Connecting to URL?',process.env.MONGO_URL)
        await loadDB();
    }
);

it(
    'Setup Indexes',
    async ()=>{
        // Unauthorized access fails
        let rejectResults = await setupHandler(undefined,undefined,{email:'john.doe@foo.bar'},{action:'setupIndexes'})
        expect(rejectResults.status).toEqual('ERROR')
        expect(rejectResults.message).toMatch(/not permitted/)
        // "Authorized" access succeeds.

        let results = await setupHandler(event,context,user,{action:'setupIndexes'})
        expect(results).toBeDefined();
        expect(results[0].indexOf('ingredients') > -1);
    }
);

it(
    'Admin access',
    async ()=>{
        let results = await setupHandler(event,context,user,{action:'has_access'})
        expect(results.access).toBeTruthy();
        let badresults = await setupHandler(event,context,{email:'foo'},{action:'has_access'})
        expect(badresults.access).toBeFalsy();
    }
);

it(
    'convenience set up',
    async () => {
        setupDBwithRecs();
    }
);
it(
    'convenience set up',
    async () => {
        setupEmptyDB();
    }
);
