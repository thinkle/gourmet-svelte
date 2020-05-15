import faunadb from 'faunadb';
const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET
})

async function fquery (query) {
    try {
        const response = await client.query(query);
        return {
            statusCode : 200,
            body : JSON.stringify(response)
        }
    }
    catch (err) {
        console.log('ERROR: ',err);
        return {
            statusCode : 400,
            error: JSON.stringify(err)
        }
    }
}


export {fquery,q}
