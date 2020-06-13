/***
    Attempting a total rewrite of recipe stores.
***/
import { readable,writable,get,derived } from 'svelte/store';
import {tick} from 'svelte'
import api from '../data/api.js';
import deepcopy from 'deepcopy'
import {diffRecs} from '../data/diff.js';
const stored = writable({});

const activePage = writable([]);
export const pageInfo = writable({
});
const actionState = writable({}) // for e.g. "searching recipes..."
const individualActionState = writable({}) // for e.g. updating recipe #123124

export const connected = readable(false,(set)=>{
    api.connect().then(
        ()=>{
            set(true)
        }
    ).catch((err)=>{
        console.log('Error connecting:',err);
    });
});
function setStoreProp (store,p,v) {
    // set store prop to value...
    store.update((d)=>{
        d[p] = v;
        return d;
    });
}

function setStoredRec (rec) {
    stored.update(
        (data)=>{
            data[rec.id] = {
                // We're keeping old data in case we've e.g. fetched new
                // summary info from the DB for a list display but we already
                // have full info fetched from another api call and we don't
                // want to remote all that data for e.g. noting whether a
                // recipe has saved of not.
                //
                // I may regret this :)
                ...data[rec.id], 
                ...deepcopy(rec)
            }
            return data;
        }
    );
}

function setStoredRecs (recs) {
    stored.update(
        (data)=>{
            recs.forEach(
                (rec)=>{
                    data[rec.id] = {...data[rec.id],...deepcopy(rec)}
                }
            );
            return data
        }
    );
}


export const storedRecipes = {
    subscribe : stored.subscribe,
    get : async function (id,mongoId) {
        let $stored = get(stored);
        if ($stored[id]) {
            return $stored[id];
        } else {
            return await recipeActions.getRecipe(id,mongoId);
        }
    }
}

export const recipePage = {
    subscribe : activePage.subscribe,
}

// Debug
// stored.subscribe(
//     (v)=>console.log('Stored updated:',Object.keys(v))
// )
// local.subscribe(
//     (v)=>console.log('Local updated:',Object.keys(v))
// )

export const recipeActions = {

    async doSync (testing) {
        await api.sync(testing,{onPartialSync:(recipes)=>{
            recipeActions.getRecipes({limit:recipes.length});
        }}); 
        await recipeActions.getRecipes({limit:50});
    },

    async createRecipe (r) {
        if (!r) {r = {}}
        setStoreProp(actionState,'creating',true)
        let recipe = await api.addRecipe(r);
        setStoredRec(recipe);
        tick()
        localRecipes.open(recipe.id);
        setStoreProp(actionState,'creating',false)
        setStoreProp(actionState,'created',recipe.id)
        return recipe;
    },
    async getRecipe (id,mongoId) {
        setStoreProp(actionState,'loading',true);
        let response = await api.getRecipe(id,{mongoId});
        if (response) {
            setStoredRec(response);
            setStoreProp(actionState,'loading',false)
        }
        return response
    },

    async openRecipe (id) {
        let rec = await recipeActions.getRecipe(id);
        if (!rec) {
            rec = await recipeActions.getRecipe(undefined,id); // mongoID?
        }
        let localCopy = await localRecipes.open(rec.id);
        return localCopy;
    },

    async getInfiniteRecipes ({query, fields, limit=15}) {
        setStoreProp(actionState,'querying',{query,fields,limit});
        let response = await api.getRecipes({query,fields,limit});
        setStoredRecs(response.result);
        activePage.set(response.result.map((r)=>r.id));
        setStoreProp(actionState,'querying',false);
        return {
            count:response.count,
            async more () {
                setStoreProp(actionState,'querying',{query,fields,limit,page:response.nextPage});                
                response = await api.getRecipes({query,fields,limit,page:response.nextPage})
                setStoredRecs(response.result);
                activePage.update(
                    (page)=>{
                        page = [...page,...response.result.map((i)=>i.id)];
                        return page
                    }
                );
                setStoreProp(actionState,'querying',false);
            }
        }
    },
    
    async getRecipes ({query,fields,limit,page}={}) {
        setStoreProp(actionState,'querying',{query,fields,limit,page});
        let response = await api.getRecipes({query,fields,limit,page});
        setStoredRecs(response.result);
        activePage.set(response.result.map((r)=>r.id));
        pageInfo.set({
            currentPage:response.currentPage,
            nextPage:response.nextPage,
            prevPage:response.prevPage,
            count:response.count,
            last:response.last,
        
        })
        setStoreProp(actionState,'querying',false);
    },
    
    async updateRecipe (recipe) {
        let updatedRecipe = await api.updateRecipe(recipe);
        setStoredRec(updatedRecipe);
    },

    async revertRecipe (id) {
        let storedRecipe = await this.getRecipe(id); //get(stored)[id]
        setStoreProp(localRecipes,id,deepcopy(storedRecipe));
    },

    async deleteRecipe (id) {
        await api.deleteRecipe(id);
        removeIdFromStores(id);
    },

    async permanentlyDeleteRecipe (id) {
        await api.permanentlyDeleteRecipe (id);
        removeIdFromStores(id);
    }
}

function removeIdFromStores (id) {
    activePage.update(
        ($ids)=>{
            console.log('Remove ID from page',id);
            $ids = $ids.filter((recId)=>recId!=id)
            console.log('Got:',$ids);
            return $ids;
        }
    );
    stored.update((data)=>{
        console.log('Remove ID from store',id);
            delete data[id]; return data});
    localRecipes.update((data)=>{
        console.log('Remove ID from local',id);
        delete data[id]; return data});
}


export const recipeActionGeneralState = {
    subscribe : actionState.subscribe
}
export const recipeActionState = {
    subscribe : individualActionState.subscribe
}


export function makeLocalRecipeStore () {
    const local = writable({});
    const localRecipes = {
        open (id, recursive=false) {
            return new Promise((resolve,reject)=>{
                if (isNaN(Number(id))) {
                    reject(`Open should be called with a numeric local ID, but got ${id}`);
                }
                let alreadyOpenCopy = get(localRecipes)[id]
                if (alreadyOpenCopy) {resolve(alreadyOpenCopy)}
                let $storedRecipes = get(storedRecipes)
                const storedRec = $storedRecipes[id]
                if (!storedRec) {
                    if (!recursive) {
                        //reject('No stored recipe exists!');
                        let result = storedRecipes.get(id).then(
                            (recipe)=>{
                                console.log('Fetched from stored, call self recursively now...');
                                localRecipes.open(id,true).then(resolve).catch(reject);
                            }
                        );
                    } else {
                        reject(`Failed to load stored recipe ID ${id}`);
                    }
                }
                else {
                    let localCopy = deepcopy(storedRec);
                    try {
                        local.update(
                            ($localRecipes)=>{
                                $localRecipes[id] = localCopy
                                return $localRecipes;
                            }
                        ); } catch (err) {
                            reject('Error updating local',err);
                        }
                    resolve(localCopy);
                }
            });
        },
        close (id) {
            local.update(
                ($local) => {
                    delete $local[id];
                    return $local;
                }
            );
        },
        ...local
    }

    const openLocalRecipes = derived(local,($local)=>{
        return Object.keys($local)
    }
                                    );

    const recipeState = derived(
        [local,stored],
        ([$local,$stored])=>{
            let recState = {}
            for (let key in $local) {
                recState[key] = {} //...$state[key])}
                let diff = diffRecs($local[key],$stored[key]);
                if (diff) {
                    // if (!recState[key].edited) {
                    //     let o1 = $local[key];
                    //     let o2 = $stored[key];
                    //     console.log(o1,'differs from',o2);
                    // }
                    recState.changes = diff;
                    console.log('Recs differ! Changed:',diff);
                    recState[key].edited = true;
                }
                else {
                    recState[key].edited = false;
                }
                if ($stored[key].savedRemote) {
                    recState[key].savedRemote = true
                }
                recState[key].last_modified = $stored[key].last_modified
            }
            return recState;
        }
    );

    return {
        localRecipes,
        openLocalRecipes,
        recipeState,
    }
    
}
const {localRecipes,openLocalRecipes,recipeState} = makeLocalRecipeStore();
export {localRecipes,openLocalRecipes,recipeState}
