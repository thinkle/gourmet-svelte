import {DB} from './mongoConnect.js';
import setupHandler from './setupDB.js';
import {fakeUser,setFakeUser} from './netlifyDevUserMock.js';
import {getUser,
        addLinkedAccounts,
        acceptLinkedAccount,
        changeName,
        markUserNotNew,
        userCache} from './userFunctions.js';

import recipeApi from './recipeFunctions.js';

const functions = {
    setup : setupHandler,
    echo,
    throwError,
    getUser,
    markUserNotNew,
    changeName,
    addLinkedAccounts,
    setFakeUser,
    acceptLinkedAccount,
    ...recipeApi
}

    
const handler = async (event, context) => {
    let params = event.queryStringParameters;
    let jsonBody = {}
    if (event.body) {
        try {
            jsonBody = JSON.parse(event.body);
        }
        catch (err) {
            console.log(`ERROR PARSING "${event.body}"`);
            throw err;
        }
    }
    params = {...jsonBody,...params}
    var {
        // this magic documented here:
        // https://www.gatsbyjs.org/blog/2018-12-17-turning-the-static-dynamic/#bonus-points-authenticated-lambda-functions-for-your-gatsby-app
        user, // actual user info you can use for your serverless functions
    } = context.clientContext
    if (!user && event.headers.referer.indexOf('localhost')>-1) {
        user = fakeUser
    }
    if (user && userCache[user.email]) {
        console.log('Got cached user',user.email)
        user.dbUser = userCache[user.email]
        user.usedCached = true;
    } else if (user) {
        console.log('!!!Fetch DB user',user)
        console.log('getUser(',event,context,user,params,')')
        user.dbUser = await getUser(event,context,user,params);
    }
    if (user) {
        user.account = user.dbUser.linked || user.email // keys to the kingdom...
    }
    let f = functions[params.mode]
    console.log('Request',params.mode,params.params)
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
        return {
            statusCode:400,
            body:JSON.stringify({error:err.toString(),
                                 params : params,
                                 jsonRequst : jsonBody,
                                 user : user,
                                })
        }
    }
    return {
        statusCode:200,
        body:JSON.stringify(body||'No return value')
    }
}


function echo (event,context,user,params) {
    return {params,
            DB,
            user:user||'no user logged in',
            context,event}
}

function throwError () {
    let duck = {}
    duck.boo.bar += 7;
}

console.log('hello world');

exports.handler = handler;
