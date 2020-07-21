import {registerHandlerObject} from '../requests/remoteRequest.js'
import loadIt from './recipeFunctions.js';
import loadItToo from './importRecipeFunction.js'
const requestHandlers = {
}
registerHandlerObject(requestHandlers);

import {DB} from './mongoConnect.js';
import setupHandler from './setupDB.js';
import {getFakeUser,fakeUser,setFakeUser} from './netlifyDevUserMock.js';
import {getUser,
        addLinkedAccounts,
        setLinkedAccounts,
        acceptLinkedAccount,
        changeName,
        markUserNotNew,
        userCache} from './userFunctions.js';

const functions = {
    setup : setupHandler,
    echo,
    throwError,
    getUser,
    setLinkedAccounts,
    markUserNotNew,
    changeName,
    addLinkedAccounts,
    setFakeUser,
    acceptLinkedAccount,
    //...recipeApi
}

    
const handler = async (event, context) => {
    console.log('Calling handler, we have cached users: ',userCache)
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
        console.log('fakeUser:',fakeUser);
        user = getFakeUser()
        user.extraApiStuff = 'fakey fake fake stuff'
    }
    if (user && userCache[user.email]) {
        console.log('Got cached user',user.email)
        user.dbUser = userCache[user.email]
        user.usedCached = true;
    } else if (user) {
        console.log('!!!Fetch DB user',user)
        //console.log('getUser(',event,context,user,params,')')
        // Note: this just gets the user...
        await getUser(user);
        userCache[user.email] = user.dbUser;
    }
    if (user && user.dbUser) {
        user.account = user.dbUser.linked || user.email // keys to the kingdom...
    }
    let body, error
    // new way
    if (requestHandlers[params.mode]) {
        console.log('Using new fangled requestHandler for ',params.mode);
        let handler = requestHandlers[params.mode]
        try {
            body = await handler(user,params);
            //console.log('Got response',body);
        } catch (err) {
            error = err;
            //console.log('Got error',error);
        }
    } else {
        // old way -- once we transition to new system, we can delete this code
        let f = functions[params.mode]
        //console.log('Request',params.mode,params.params)
        if (!f) {
            return {
                statusCode:400,
                body:JSON.stringify({error:`No function associated with requested mode ${params.mode}`}),
            }
        }
        try {
            body = await f(event,context,user,params)
        } catch (err) {
            error = err;
        }
    }
    if (body) {
        //console.log('Return response');
        return {
            statusCode:200,
            body:JSON.stringify(body||'No return value')
        }
    } else { // error
        if (!error) {
            error = 'Function had no return value';
        }
        return {
            statusCode:400,
            body:JSON.stringify({error: error.toString(),
                                 params : params,
                                 jsonRequst : jsonBody,
                                 user : user,
                                })
        }
    }
}


function echo (event,context,user,params) {
    return {params,
            DB,
            user:user,
            context,event}
}

function throwError () {
    let duck = {}
    duck.boo.bar += 7;
}

//console.log('hello world');

exports.handler = handler;
