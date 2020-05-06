import querystring from 'querystring'

const baseURL = "/.netlify/functions/api?"

//mode=echo&message=howdy"
function requestURI (mode,params) {
    return baseURL + querystring.stringify(
        {mode:mode,
         ...params}
    )
}
const u = requestURI // shorthand

async function doFetch (mode, user, params) {
    console.log('fetch URL',u(mode,params))
    let result = await fetch(u(mode,params),{
                         headers : {
               Accept : 'application/json',
               Authorization : 'Bearer ' + (user && user.access_token || '')
                         }
    }
                            );
    if (result.status==200) {
        return result.json(); // return the promise from text...
    }
    else {
        let e = Error('Error fetching');
        e.status = result.status;
        e.result=result;
        e.url = u(mode,params)
        e.error = await result.json();
        console.log('Throwing an error everyone',e);
        throw e;
    }
}

export default {doFetch}
