const url = process.env.MONGO_URL;
const mongopw = process.env.MONGO_PASSWORD;
const mongouser = process.env.MONGO_USER;
import {MongoClient,Server} from 'mongodb';

console.log('Hello beautiful world');
console.log('Using URL',url);

function loadDB (name) {
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

async function runTest () {
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

export {runTest}
