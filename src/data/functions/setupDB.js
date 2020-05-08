//import {fquery,q} from './faunaUtil.js';
//import {runQuery,runImport} from './gql.js';
import {loadDB,runTest,insertOne,insertMany,queryCollection} from './mongoConnect.js';
import recs from '../recs.json'
import {validateRec,prepRecs} from '../validate.js'

const functions = {
    mongoConnect : runTest,
    setupIndexes : async function () {
        let results = []
        results.push(await functions.create_recipe_index());
        results.push(await functions.create_user_index());
        return results;
    },
    has_access : async (event,context,user,params)=>{
        if (user.email=='tmhinkle@gmail.com') {
            return {access:true}
        }
        else {
            return {
                access:false
            }
        }
    },
    create_user_index : async ()=>{
        const {client,db} = await loadDB();
        const c= db.collection('users')
        await c.createIndex({name:1});
        return await c.createIndex({email:1})
    },
    query_recipes : async ()=>{
        return queryCollection(
            'recipes',
            {'fullText':/oven/i},
            {});
    },
    create_recipes : async (event,context,user,params)=>{
        //fquery(q.Collection('users'))
        let {client,db} = await loadDB();
        try {
            let result = await db.collection('recipes').drop();
            console.log('dropped with result',result);
        }
        catch (err) {
            console.log('unable to drop recipes - maybe does not exist yet?');
        }
        prepRecs(recs,user);
        return await insertMany('recipes',recs.recipes);
    },
    create_recipe_index : async () => {
        const {client,db} = await loadDB();
        const c= db.collection('recipes')
        const results = []
        for (let [index,options] of [
            [{'title':1},{}],
            [{'fullText.item':'text'},{name:'fulltext'}],
            [{'categories.name':1},{name:'category'}],
            [{'flatIngredients.item':1},{name:'ingredients'}],
        ]) {
            try {
                results.push(await c.createIndex(index,options));
            }
            catch (err) {
                console.log(err)
                console.log('Message:',err.errmsg)
                results.push(err)
            }
        }
        return results
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
