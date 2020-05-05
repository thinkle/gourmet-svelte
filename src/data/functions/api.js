//import faunadb from 'faunadb';

const handler = async (event, context) => {
    let params = event.queryStringParameters;
    console.log('hello world',params)
    return {
        statusCode:200,
        body:`Got params: ${JSON.stringify(params)}`
    }
}

console.log('hello world');

exports.handler = handler;
