//import {fquery,q} from './faunaUtil.js';
//import {runQuery,runImport} from './gql.js';
import {runTest} from './mongoConnect.js';
import recs from '../recs.json'

function prepRecs () {

    const salt = '1771'

    function makeId (id) {
        return `$recs.metadata.name+'-'+${salt}+'-'{id}`
    }

    recs.recipes.forEach(
        (r)=>{
            r.id = makeId(r.localid);
            crawlIngsForIds(r);
        }
    );

    function crawlIngsForIds (ii) {
        ii.forEach(
            (i) => {
                if (i.reference) {
                    i.reference = makeId(i.reference);
                }
            }
        );
    }
}

const functions = {
    mongoConnect : runTest,
    has_access : ()=>({access:true}),
    create_users : async ()=>{
        let result1 = await fquery(q.CreateCollection({name:'users'}));
        let result2 = await fquery(q.CreateCollection({name:'recipes'}));
        return {results:[result1,result2]}
    },
    create_user_index : () => {
        return fquery(q.CreateIndex(
            {
                name: "users-by-email",
                source: q.Collection("users"),
                terms: [{field:['email']}],
            }
        ));
    },
    create_recipes : (event,context,user,params)=>{
        fquery(q.Collection('users'))
    },
    create_schema : ()=>runImport(),
    create_recipe_index : () => {
        q.CreateIndex(
            {
                name: "recipes_by_collection",
                source: q.Class("users"),
                terms: [{ field: [q.Term('data'), q.Term('email')] }],
                unique: true
    })
    },
}

export default async function (event, context, user, params) {
    console.log('setup running...',params);
    if (user && user.email=='tmhinkle@gmail.com') {
        return functions[params.action](event,context,user,params)
        //return {message:'Congratulations, you are allowed via my hard-coded non-secure security magic!'}
    }
    else {
        return {message:'No way sir, no how no go: user not permitted!!,',
                user:user||'no user logged in'}
    }
}

let actions = Object.keys(functions);
export {actions}
