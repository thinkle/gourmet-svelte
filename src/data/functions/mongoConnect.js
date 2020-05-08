const url = process.env.MONGO_URL;
const mongopw = process.env.MONGO_PASSWORD;
const mongouser = process.env.MONGO_USER;
import {MongoClient,Server} from 'mongodb';
import {testRecs} from '../../common/mocks/recipes.js'
const DB = 'devtest'

console.log('Hello beautiful world');
console.log('Using URL',url);

export function loadDB (name=DB) {
    return new Promise ((resolve,reject)=>{
        const client = new MongoClient(url, { useNewUrlParser: true });
        client.connect(err => {
            if (err) {
                console.log('Error?',err);
                reject(err)
            }
            const db = client.db(name);
            console.log('Got DB',db)
            resolve({
                client,db
            });
        });
    });
}

export async function insertMany (collection, docs) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .insertMany(docs)
    return result;
}

export async function insertOne (collection, doc) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .insertOne(doc)
    let resultDoc = {...doc,
                     _id : result.insertedId}
    return resultDoc;
}

export async function getOne (collection, query) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .findOne(query);
    return result;
}

export async function updateOne (collection, query, values) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .updateOne(query,values);
    return result;
}

export async function queryCollection (collection, query, options) {
    const {db,client} = await loadDB(DB)
    let cursor = await db.collection(collection)
        .find(query,options);
    let count = await cursor.count()
    console.log("COUNT",count)
    cursor.limit(100)
    let result = await cursor.toArray()
    return {
        count:count,
        result:result
    }
}


async function adminTest () {
    const {db,client} = await loadDB();
    
}

export async function runTest () {
    return await insertOne('recipes',);
    const {db,client} = await loadDB('recipes')
    console.log('Connected with more elegant syntax');
    let doc = await db.collection('test')
        .insertOne({greeting:'hello',audience:'world'})
    console.log('Created doc:',doc);
    return {
        doc,
        status : 'awesome sauce'
    }
}


function runTestOrig () {
    return new Promise ((resolve,reject)=>{
    const client = new MongoClient(url, { useNewUrlParser: true });
        client.connect(err => {
            if (err) {
                console.log('Error?',err);
                reject(err)
            }
            const collection = client.db("test").collection("devices");
            // perform actions on the collection object
            console.log('I connected');
            client.close();
            resolve({status:'Success!'})
        });
    });
}

//export {runTest,insertOne,insertMany,loadDB,queryCollection}
