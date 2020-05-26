// Our "glue" layer between local data and remote data.
// This layer will handle syncing of data between remote and local storage

import localApi from './dexieApi.js';
import {RecipeApi} from './remoteApi.js';
import {user} from '../stores/user.js';
import status from '../stores/status.js';
import {prepRecLocal} from '../data/validate.js';
import {jsonConcisify} from '../utils/textUtils.js';

let remoteApi;

user.subscribe(
    (u)=>{
        console.log('remoteApi got a new user',u);
        remoteApi = RecipeApi(u);
    });

const api = {
    ...localApi,
    async addRecipe (recipe) {
        recipe.last_modified = new Date().getTime();
        let recid = await localApi.addRecipe(recipe)
        recipe.id = recid;
        try {
            let remoteRec = await remoteApi.addRecipe(recipe);
            remoteRec.savedRemote = true;
            recipe.savedRemote = true; // update the object we were handed in case it sticks around...
            await localApi.updateRecipe(remoteRec);
            return remoteRec;
        }
        catch (err) {
            console.log('Error saving remotely',err.toString())
            console.log(err)
        }
        return recipe;
    },
    async updateRecipe (recipe) {
        recipe.last_modified = new Date().getTime();
        try {
            let remoteRec = await remoteApi.updateRecipe(recipe);
            recipe.savedRemote = true;
            recipe._id = remoteRec._id;
        }
        catch (err) {
            recipe.savedRemote = false;
        }
        await localApi.updateRecipe(recipe);
        return recipe;
    },
    async updateRecipes (recipes) {
        recipes.map(this.updateRecipe); // lazy & bad -- fixme if we actually implement features that use this
    },
    async sync (test=false,{onPartialSync}) {
        if (!localApi.db) {
            await localApi.connect();
        }
        let statusId = status.createStatus('Syncing Recipes from database...',{type:'recipe'});

        let keepFetchingIDs = true;
        let idPage = 0;
        let result = []
        
        while (keepFetchingIDs) {
            status.start(statusId);
            let remoteResponse = await remoteApi.getRecipes({fields:['_ID','id','last_modified','owner'],page:idPage});
            let remoteRecs = remoteResponse.result;
            status.progress(statusId,{name:'Fetching recipes from server',
                                      amount:remoteResponse.page,
                                      total:remoteResponse.count});
            let recsToFetch = [];
            for (let remoteRec of remoteRecs) {
                // What if we have remote but no local?
                //if (!remoteRec.id) { return true }
                // otherwise... fetch it (this is probably inefficient
                // and stupid, but let's just move forward for now...)
                let localCopy = await localApi.getRecipe(undefined,{mongoId:remoteRec._id});
                if (localCopy && localCopy.last_modified < remoteRec.last_modified) {
                    recsToFetch.push(remoteRec)
                }
                else if (!localCopy) {
                    recsToFetch.push(remoteRec)
                }
            }
            console.log('Checking recipes on server',recsToFetch.length,'of',remoteRecs.length,'possible...');
            let keepGoing = true;
            let page = 0;
            while (keepGoing && recsToFetch.length > 0) {
                status.progress(
                    statusId,
                    {name:'Fetching more recent data from server...',
                     amount:remoteResponse.page+page,
                     total:remoteResponse.count+recsToFetch.length
                    }
                );
                let fullRecResponse = await remoteApi.getRecipes({
                    query:{_id:{$in:recsToFetch.map((r)=>r._id)}},
                    limit:10, page, 
                })
                console.log('updating with local recipes...');
                fullRecResponse.result.forEach((r)=>r.savedRemote=true); // mark all as saved :)
                await localApi.updateRecipes(fullRecResponse.result);
                if (onPartialSync) {
                    onPartialSync(fullRecResponse.result);
                }
                console.log('Done...');
                if (test) {
                    console.log('SYNC EXITING EARLY - THIS IS JUST A TEST BABY');
                    status.complete(statusId,{name:'Exiting early - testing mode!'});
                    return
                }
                result.push(fullRecResponse.result)
                page = fullRecResponse.page;
                if (page < fullRecResponse.count) {
                    keepGoing = true;
                    console.log('more to fetch... keep fetching... ',page,fullRecResponse.count)
                }
                else {
                    keepGoing = false;
                }
            }
            keepFetchingIDs = remoteResponse.page < remoteResponse.count
            idPage = remoteResponse.page
        }
        status.complete(statusId,{name:`Done syncing recipes: fetched ${result.length} updated items.`,
                                  amount:result.length.count,
                                  total:result.length})
        return {recs:result}
    },
}

export default api;
