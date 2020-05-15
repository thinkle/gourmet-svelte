const secret = process.env.FAUNADB_SERVER_SECRET
const url = 'https://graphql.fauna.com/graphql'
//const importUrl = 'https://graphql.fauna.com/import?mode=merge'
const importUrl = 'https://graphql.fauna.com/import?mode=override'
import schema from './schema.js';
import fetch from 'node-fetch';

async function runImport () {
    console.log('running import of schema',schema)
    let result = await fetch(
        importUrl,
        {
            method : 'POST',
            headers : {'Authorization' : 'Bearer '+secret},
            body : schema
        });
    console.log('Got result',result);
    // let json
    // try {
    //     json = await result.json()
    //     console.log('JSON=>',json);
    // }
    // catch (err) {
    //     console.log('No good json...',err);
    let text = await result.text();
    //}
    return text
}

async function runQuery (query) {
    let result = await fetch(
        url,
        {
            method : 'POST',
            headers : {'Authorization' : 'Bearer '+secret},
            body : JSON.stringify({
                query : query
            })
        }
    );
    const json = await result.json()
    return json
}

export {runQuery,runImport}
    
