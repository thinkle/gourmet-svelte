/***
    Attempting a total rewrite of recipe stores.
***/
import { readable,writable,get,derived } from 'svelte/store';
import {tick} from 'svelte'
import api from '../data/api.js';
export {connectedRemote} from '../data/api.js';
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
                // want to remove all that data for e.g. noting whether a
                // recipe has saved of not.
                //
                // I may regret this :)
                ...data[rec.id], 
                ...deepcopy(rec)
            }
            if (rec._id) {
                data[rec._id] = rec;
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
                    // possibly keep old data in case new data is partial
                    data[rec.id] = {...data[rec.id],...deepcopy(rec)}
                    if (rec._id) {
                        data[rec._id] = data[rec.id];
                    }
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
        } else if ($stored[mongoId]) {
            return $stored[mongoId]
        } else {
            let result =  await recipeActions.getRecipe(id,mongoId);            
            return result;
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

    async doSync ({testing=false,
                   onPartialSync,
                   onSync
                  }={}) {
        await api.sync(testing,{onPartialSync});
        if (onSync) {onSync()} //await recipeActions.getRecipes({limit:50});
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

    async getInfiniteRecipes ({query, fields, limit=15,sort}) {
        setStoreProp(actionState,'querying',{query,fields,limit});
        let response = await api.getRecipes({query,fields,limit,sort});
        setStoredRecs(response.result);
        activePage.set([...new Set(response.result.map((r)=>r.id))]);
        setStoreProp(actionState,'querying',false);
        return {
            count:response.count,
            async more () {
                setStoreProp(actionState,'querying',{query,fields,limit,sort,page:response.nextPage});                
                response = await api.getRecipes({query,fields,limit,sort,page:response.nextPage})
                setStoredRecs(response.result);
                activePage.update(
                    (page)=>{
                        page = [...new Set([...page,...response.result.map((i)=>i.id)])];
                        return page
                    }
                );
                
                setStoreProp(actionState,'querying',false);
            }
        }
    },
    
    async getRecipes ({query,fields,sort,limit,page}={}) {
        setStoreProp(actionState,'querying',{query,fields,sort,limit,page});
        let response = await api.getRecipes({query,fields,sort,limit,page});
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
            $ids = $ids.filter((recId)=>recId!=id)
            return $ids;
        }
    );
    stored.update((data)=>{
            delete data[id]; return data});
    localRecipes.update((data)=>{
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
                let mongoId
                if (isNaN(Number(id))) {
                    mongoId = id;
                    id = undefined;
                }
                let alreadyOpenCopy = id && get(localRecipes)[id]
                if (alreadyOpenCopy) {resolve(alreadyOpenCopy)}
                let $storedRecipes = get(storedRecipes)
                const storedRec = $storedRecipes[id]
                if (!storedRec) {
                    if (!recursive) {
                        let result = storedRecipes.get(id,mongoId).then(
                            (recipe)=>{                                
                                if (recipe) {
                                    local.update(
                                        ($localRecipes)=>{
                                            let retrieved_id = recipe.id;
                                            if (!retrieved_id) {
                                                console.log('Recipe has no iD????',retrieved_id,recipe);
                                                reject(`Recipe without id! #$#$@#%& ${JSON.stringify(recipe)}`);
                                            }
                                            let retrieved_mongoId = recipe._id;
                                            $localRecipes[retrieved_id] = deepcopy(recipe);
                                            if (retrieved_mongoId) {
                                                $localRecipes[retrieved_mongoId] = $localRecipes[retrieved_id]
                                            }
                                            resolve($localRecipes[retrieved_id])
                                            return $localRecipes;
                                        }
                                    );
                                } else {
                                    console.log('!!Unable to open recipe',id,mongoId);
                                }
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
                                if (localCopy._id) {
                                    $localRecipes[localCopy._id] = localCopy;
                                }
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
        return Object.keys($local).filter((id)=>!isNaN(Number(id))) // only local ids
        //return Object.keys($local)
    }
                                    );

    const recipeState = derived(
        [local,stored],
        ([$local,$stored])=>{
            let recState = {}
            for (let key in $local) {
                recState[key] = {} //...$state[key])}
                if (!$stored[key]) {
                    recState[key].savedRemote = undefined;
                    recState[key].last_modified = undefined;
                } else {
                    let diff = diffRecs($local[key],$stored[key]);
                    if (diff) {
                        recState.changes = diff;
                        recState[key].edited = true;
                    }
                    else {
                        recState[key].edited = false;
                    }
                    if ($stored[key] && $stored[key].savedRemote) {
                        recState[key].savedRemote = true
                    }
                    recState[key].last_modified = $stored[key].last_modified
                }
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

export const categoryNames = writable([],(set)=>{
    api.getCategories().then((categories)=>{
        set(categories.map((cname)=>({name:cname})));
    });
    return ()=>{
        //console.log('no more subscribers to cats');
    }
});


export const lookupStores = {
    categories : categoryNames,
}


const {localRecipes,openLocalRecipes,recipeState} = makeLocalRecipeStore();
export {localRecipes,openLocalRecipes,recipeState}
