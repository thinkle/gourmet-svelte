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
    
    let result = await fetch(u(mode),{
        method : 'post',
        headers : {
            Accept : 'application/json',
            'Content-Type':'application/json',
            Authorization : 'Bearer ' + (user && user.access_token || '')
        },
        body : JSON.stringify(params)
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
        try {
            console.log(JSON.stringify(e))
            console.log(e.toString());
        }
        catch (ee) {
            console.log('Cannot toString that baby?');
        }
        throw e;
    }
}


function RecipeApi (user) {
    
    return {
        connect () {
            // eventually we should probably check if the user is logged in
            // and can access the MongoDB or something...
            if (user) {
                return true;
            }
        },
        addRecipe (recipe) {
            return doFetch(
                'addRecipe',
                user,
                {recipe}
            );
        },
        updateRecipe (recipe) {
            
        },
        updateRecipes (recipes) {
            return doFetch(
                'updateRecipe',
                'fixme'
            );
        },
        getRecipe (recid) {
            return doFetch(
                'getRecipe',
                user,
                {id:recid}
            );
        },
        getRecipes ({query,fields,limit,page}={}) {
            if (!query) {
                query = {}
            }
            if (query['owner.email']) {
                console.log('Warning: we had another email query???');
                console.log('Quashing it: it was',query);
            }
            query['owner.email'] = user.email;
            console.log('doFetch with query',query);
            let args = {query,fields,limit,page};
            return doFetch(
                'getRecipes',
                user,
                args
            );
        },
        deleteRecipe (id) {
        }
    }

}
export {doFetch}
export {RecipeApi}


export default {doFetch,RecipeApi}
