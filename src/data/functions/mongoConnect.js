const url = process.env.MONGO_URL;
const mongopw = process.env.MONGO_PASSWORD;
const mongouser = process.env.MONGO_USER;
import {MongoClient,Server} from 'mongodb';
import {testRecs} from '../../common/mocks/recipes.js'
const DB = 'devtest'

export function loadDB (name=DB) {
    return new Promise ((resolve,reject)=>{
        const client = new MongoClient(url, { useNewUrlParser: true });
        client.connect(err => {
            if (err) {
                console.log('Error?',err);
                reject(err)
            }
            const db = client.db(name);
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
    return result.ops;
}

export async function insertOne (collection, doc) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .insertOne(doc)
    return result.ops[0];
}

export async function getOne (collection, query) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .findOne(query);
    return result;
}

export async function replaceOne (collection, query, document) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .replaceOne(query,document);
    return result.ops[0];
}


export async function updateOne (collection, query, values) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .updateOne(query,values);
    return result.ops[0];
}

export async function deleteOne (collection, query) {
    const {db,client} = await loadDB(DB)
    let result = await db.collection(collection)
        .deleteOne(query);
    return result.deletedCount
}

export async function queryCollection (collection, query, {fields, limit=100,page=0}={}) {
    const {db,client} = await loadDB(DB)
    //console.log('query',collection,'for',query)
    if (Array.isArray(fields)) {
        let _fields = {}
        fields.forEach((f)=>_fields[f]=1)
        fields = _fields
    }
    //console.log(query,fields);
    let cursor = await db.collection(collection)
        .find(query);
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
    let result = await cursor.toArray()
    //console.log('Page:',result.length + page);
    return { // FIXME: handle pagination
        count:count,
        result:result,
        page:result.length+page,
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
    const client = new MongoClient(url, { useNewUrlParser: true });
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
