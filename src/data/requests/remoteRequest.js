/*
  An abstraction and validation layer for handling remote API requests.

  This looks much like the layer we use for channels within Chrome extensions.

  We can make files full of the "Channels" we want to use for communication -- e.g.


  addUserRequest = RemoteAction({
      name : 'addUser',
      requestDef : {name:'',email:''},
      responseDef : {name:'',email:'',_id:''},
  })

  //Then on the lambda function side of our app, we call...

  addUserRequest.handleRequest(
      (user,params)=>{}
  );

  // And on the webapp side of our app, we call...

  addUserRequest.makeRequest(
      {name:'Joe Shmoe',email:'foo@bar'}
  );

  // We get validation errors on both sides before the data is sent/returned.
  
*/
import validate from '../../utils/validator.js';
import querystring from 'querystring'
import { authenticatedFetch } from '../../auth/authenticatedFetch.js';


// Function side...
var handlerLookup = {};

export function registerHandlerObject (o) {
    console.log('Set up handler!',o)
    Object.assign(o,handlerLookup); // copy over props;
    handlerLookup = o;
}

// Client side...
const baseURL = "/.netlify/functions/api?"

function requestURI (mode,params) {
    return baseURL + querystring.stringify(
        {mode:mode,
         ...params}
    )
}
const u = requestURI // shorthand

export function Request ({
    name,
    requestDef,
    responseDef,
    chatty,
}) {
    return {
        requestDef,
        responseDef,
        async makeRequest ({user,params}) {
            if (!user) {
                throw 'No user!'
            }
            try {
                validate(params,requestDef);
                if (chatty) {
                    console.log(`RemoteAction ${name} Sending valid request`);
                }
            } catch (err) {
                console.log(`$RemoteAction ${name} makeRequest called with invalid parameters:`,params);
                console.log('Expected',requestDef);
                err.context = this;
                throw err;
            }
            let headers = {
                Accept : 'application/json',
                'Content-Type':'application/json',
            }
            if (typeof DEV !== 'undefined' && DEV === true) {
                // Local development only (see functions/localDevAuth.js). A
                // deployed build must not send the user record in a header.
                headers.localuser = user && JSON.stringify(user) || '';
            }
            let result = await authenticatedFetch(user,u(name),{
                method : 'post',
                headers,
                body : JSON.stringify(params)
            });
            if (result.status === 200) return result.json();
            const body = await result.json().catch(() => null);
            if (result.status === 400 && body) throw body;
            throw Object.assign(new Error(body?.error || "Error fetching"), { status: result.status });
        },
        /** 
        * @param {requestCallback} cb - callback(user, params) 
        */
        setRequestHandler (f) {           
            async function handleRequest (user, params) {                
                let result = await f(user,params);
                try {
                    validate(result,responseDef);
                } catch (err) {
                    console.log(`$RemoteAction ${name} makeRequest handler created invalid response:`,result);
                    console.log('Expected',responseDef);
                    err.context = this;
                    throw err;
                }
                return result;
            };
            handlerLookup[name] = handleRequest;
        },
    }
}
