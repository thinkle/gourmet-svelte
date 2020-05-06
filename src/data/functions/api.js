//import faunadb from 'faunadb';
import setupHandler from './setupDB.js';
const functions = {
    setup : setupHandler,
    echo : echo,
    throwError : throwError,
}

const handler = async (event, context) => {
    let params = event.queryStringParameters;
    console.log('handler got params:',params)
    const {
        // this magic documented here:
        // https://www.gatsbyjs.org/blog/2018-12-17-turning-the-static-dynamic/#bonus-points-authenticated-lambda-functions-for-your-gatsby-app
        user, // actual user info you can use for your serverless functions
    } = context.clientContext
    let f = functions[params.mode]
    if (!f) {
        return {
            statusCode:400,
            body:JSON.stringify({error:`No function associated with requested mode ${params.mode}`}),
        }
    }
    let body
    try {
        body = await f(event,context,user,params)
    }
    catch (err) {
        console.log('ERROR!',err);
        return {
            statusCode:400,
            body:JSON.stringify({error:err.toString()})
        }
    }
    return {
        statusCode:200,
        body:JSON.stringify(body)
    }
}


function echo (event,context,user,params) {
    return {params,user,context,event}
}

function throwError () {
    let duck = {}
    duck.boo.bar += 7;
}

console.log('hello world');

exports.handler = handler;
