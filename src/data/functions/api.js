import {registerHandlerObject} from '../requests/remoteRequest.js'
import './recipeFunctions.js';
import './importRecipeFunction.js';
import './nutritionFunctions.js';

const requestHandlers = {
}
registerHandlerObject(requestHandlers);

import {DB} from './mongoConnect.js';
import './setupDB.js';
import {fakeUser} from './netlifyDevUserMock.js';
import {userCache,getUser} from './userFunctions.js';

    
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
        user = fakeUser;
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
        let handler = requestHandlers[params.mode]
        try {
            body = await handler(user,params);
            //console.log('Got response',body);
        } catch (err) {
            error = err;
            //console.log('Got error',error);
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

// A couple of utility functions
import {EchoRequest,ThrowErrorRequest} from '../requests/index.js';

EchoRequest.setRequestHandler((user,params) => {
    return {params,
            DB,
            user:user,
            }
    }
);

ThrowErrorRequest.setRequestHandler(
    ()=>{
        let duck = {};
        duck.boo.bar += 7;
    }
);


exports.handler = handler;
