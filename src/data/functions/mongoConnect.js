import {MongoClient,Server} from 'mongodb';
import {testRecs} from '../../common/mocks/recipes.js'

// One database, on purpose. Production, the dev deploy, branch previews and
// local development all use it (decided 2026-11-16), so the app is always
// built and used against real recipes. It used to be a placeholder swapped in
// by the build; when the swap did not run, the app quietly wrote to a
// database literally named after the placeholder.
export const DB = 'Gourmet'

/** True only for a connection string whose every host is this machine. */
export function isLocalMongoUrl (url) {
    if (typeof url !== 'string' || !/^mongodb:\/\//i.test(url)) {
        return false; // includes mongodb+srv://, which is never local
    }
    let rest = url.replace(/^mongodb:\/\//i, '');
    rest = rest.slice(rest.lastIndexOf('@') + 1); // drop credentials
    const hosts = rest.split(/[/?]/)[0].split(',');
    return hosts.length > 0 && hosts.every((host) => {
        const name = host.replace(/:\d+$/, '').toLowerCase();
        return name === '127.0.0.1' || name === 'localhost' || name === '[::1]';
    });
}

function runningUnderTest () {
    return process.env.JEST_WORKER_ID !== undefined
        || process.env.VITEST !== undefined
        || process.env.NODE_ENV === 'test';
}

/**
   The connection string, read when we connect rather than when this file is
   loaded. Because the one database is the real one, a test run may only ever
   connect to an in-memory server on this machine.
*/
function mongoUrl () {
    const url = process.env.MONGO_URL;
    if (runningUnderTest() && !isLocalMongoUrl(url)) {
        throw new Error(
            'Refusing to connect to MongoDB from a test run: MONGO_URL is not a local in-memory server.'
        );
    }
    return url;
}

let announcedDatabase = false;

/**
   For actions that drop a collection (the test seeding in setupDB.js). They
   were written for a throwaway database; now that every environment uses the
   real one they may only run against an in-memory server on this machine.
*/
export function assertDisposableDatabase (action) {
    if (!isLocalMongoUrl(process.env.MONGO_URL)) {
        throw new Error(
            `${action} drops a collection and is disabled: this is the real database.`
        );
    }
}

var lastResult = undefined

let cachedDB;

export function getLastResult () {
    return lastResult;
}

export function loadDB (name=DB) {
    return new Promise ((resolve,reject)=>{
        if (cachedDB) {
            if (cachedDB.db.serverConfig.s.coreTopology.state==='connected') {
                console.log('using cache!')
                resolve(cachedDB);
                return;
            } else {
                console.log('Trouble with cache?',cachedDB)
            }
        }
        let url;
        try {
            url = mongoUrl();
        } catch (err) {
            reject(err);
            return;
        }
        const client = new MongoClient(url, { useNewUrlParser: true });
        client.connect(err => {
            if (err) {
                console.log('Error?',err);
                reject(err)
            }
            if (!announcedDatabase) {
                console.log('MongoDB: using database', name);
                announcedDatabase = true;
            }
            const db = client.db(name);
            cachedDB = {client,db}
            resolve({
                client,db
            });
        });
    });
}

export async function insertMany (collection, docs) {
    const {db,client} = await loadDB(DB)
    lastResult = await db.collection(collection)
        .insertMany(docs)
    return lastResult.ops;
}

export async function insertOne (collection, doc) {
    const {db,client} = await loadDB(DB)
    lastResult = await db.collection(collection)
        .insertOne(doc)
    return lastResult.ops[0];
}

export async function getOne (collection, query) {
    const {db,client} = await loadDB(DB)
    lastResult = await db.collection(collection)
        .findOne(query);
    return lastResult;
}

export async function replaceOne (collection, query, document) {
    const {db,client} = await loadDB(DB)
    lastResult = await db.collection(collection)
        .replaceOne(query,document,{upsert:true});
    return lastResult.ops[0];
}


export async function updateOne (collection, query, values) {
    const {db,client} = await loadDB(DB)
    //return await new Promise((resolve,reject)=>{
    let result = await db.collection(collection)
        .findOneAndUpdate(query,
                          values,
                          {
                              returnOriginal:false,
                              upsert:true
                          },
                          // (err,doc)=>{
                          //     if (err) {
                          //         reject(err)
                          //     } else {
                              //         console.log('findOneAndUpdate says',doc)
                          //         resolve(doc.value)
                              //     }
                          // }
                         );
    return result.value
//});
    // if (lastResult.result.ok) {
    //     //return lastResult.ops[0];
    //     return db.collection(collection).find()
    // } else {
    //     console.log('Unsuccessful update: ',lastResult);
    //     throw new Error(
    //         `Unable to update item: ${collection} ${JSON.stringify(query)} ${JSON.stringify(values)}: Result ${JSON.stringify(lastResult)}`
    //     );
    // }
}

export async function deleteOne (collection, query) {
    const {db,client} = await loadDB(DB)
    lastResult = await db.collection(collection)
        .deleteOne(query);
    return lastResult.deletedCount
}

export async function queryCollection (collection, query, {fields, limit=100,page=0,sort}={}) {
    const {db,client} = await loadDB(DB)
    //console.log('query',collection,'for',query)
    if (Array.isArray(fields)) {
        let _fields = {}
        fields.forEach((f)=>_fields[f]=1)
        fields = _fields
    }

    let cursor = await db.collection(collection)
        .find(query);
    if (sort) {
        console.log('Sorting!',sort)
        cursor = cursor.sort(sort);
    }
    let count = await cursor.count()
    //console.log("COUNT",count,'limit',Number(limit))
    if (page) {
        cursor.skip(page);
    }
    cursor.limit(Number(limit))
    if (fields) {
        //console.log('projecting to ',fields);
        cursor = cursor.project(fields)
    }
    lastResult = await cursor.toArray()
    //console.log('Page:',lastResult.length + page);
    return { // FIXME: handle pagination
        count:count,
        result:lastResult,
        page:lastResult.length+page,
    }
}


async function adminTest () {
    const {db,client} = await loadDB();
    
}

export async function runTest () {
    return await insertOne('recipes',);
    const {db,client} = await loadDB('recipes')
    //console.log('Connected with more elegant syntax');
    let doc = await db.collection('test')
        .insertOne({greeting:'hello',audience:'world'})
    //console.log('Created doc:',doc);
    return {
        doc,
        status : 'awesome sauce'
    }
}


function runTestOrig () {
    return new Promise ((resolve,reject)=>{
    const client = new MongoClient(mongoUrl(), { useNewUrlParser: true });
        client.connect(err => {
            if (err) {
                //console.log('Error?',err);
                reject(err)
            }
            const collection = client.db("test").collection("devices");
            // perform actions on the collection object
            //console.log('I connected');
            client.close();
            resolve({status:'Success!'})
        });
    });
}

//export {runTest,insertOne,insertMany,loadDB,queryCollection}
