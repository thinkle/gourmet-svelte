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
                    console.log(`RemoteAction ${name} Sending valid request `,user,params);
                }
            } catch (err) {
                console.log(`$RemoteAction ${name} makeRequest called with invalid parameters:`,params);
                console.log('Expected',requestDef);
                err.context = this;
                throw err;
            }
            let result = await fetch(u(name),{
                method : 'post',
                headers : {
                    Accept : 'application/json',
                    'Content-Type':'application/json',
                    Authorization : 'Bearer ' + (user && user.access_token || ''),
                    localuser : user && JSON.stringify(user) || '',
                },
                body : JSON.stringify(params)
            });
            if (result.status==200) {
                return result.json(); // return the promise from text...
            } else if (result.status==400) {
                let e = await result.json()
                throw e;
            }
            else {
                let e = Error('Error fetching');
                e.status = result.status;
                e.url = u(name,params)
                e.error = await result.json();
                throw e.error;
            }
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
