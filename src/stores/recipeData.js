import { writable,get } from 'svelte/store';
import localApi from '../data/api.js';
import deepcopy from 'deepcopy';
import RecDef from '../common/RecDef.js';
const connected = writable(false);
const recipeData = writable({});
const fetchData = writable({});
const updateCount = writable({});

console.log('Connect to local API...');
localApi.connect().then(
    ()=>{
        connected.update(()=>true)
    }
);

function sanitize (recipe) {
    console.log('Called sanitize!');
    let sanitized = {}
    
    RecDef.titleProps.forEach(
        (p)=>{
            if (recipe[p.name]) {
                sanitized[p.name] = recipe[p.name]
            }
        }
    );
    RecDef.recProps.forEach(
        (p)=>{
            if (recipe[p.name]) {
                sanitized[p.name] = recipe[p.name]
            }
        }
    );
    RecDef.idProps.forEach(
        (p)=>{
            if (recipe[p.name]) {
                sanitized[p.name] = recipe[p.name]
            }
        }
    );
    sanitized.images = recipe.images || [];
    sanitized.text = recipe.text;
    sanitized.ingredients = deepcopy(recipe.ingredients) || [];
    sanitized.ingredients.forEach(sanitizeIngredient);

    return sanitized
    // {
    //     title:recipe.title,
    //     text:recipe.text||{},
    //     ingredients:recipe.ingredients&&recipe.ingredients.map(sanitizeIngredient)||[],
    //     images:recipe.images||[],
    //     id:recipe.id,
    //     _id:recipe._id,
    //     localid:recipe.localid,
    // }; // only the stuff we care about

    function sanitizeIngredient (i) {
        i = {...i}
        delete i.awidth;
        delete i.uwidth;
        delete i.iwidth;
        if (i.ingredients) {
            i.ingredients.forEach((i)=>sanitizeIngredient(i));
        }
        return i
    }
}

function resolveRec (rec) {
    rec.local = sanitize(rec.local);
    console.log('resolve local from',rec)
    rec.current = deepcopy(rec.local)
    rec.changed = false;
}

function setLocalFetchState (state,rid) {
    fetchData.update(()=>state)
    if (rid) {
        recipeData.update((data)=>{
            data[rid].localState = state;
            return data;
        })
    }
}

function updateLocalData (data, id, newVals) {
    if (!data[id]) {data[id] = newVals}
    else {
        data[id] = {...data[id],...newVals}
    }
    resolveRec(data[id])
    data[id] = deepcopy(data[id])
}

function diffRecs (r1,r2) {
    r1  = sanitize(r1);
    r2 = sanitize(r2);
    let changed = [];
    for (let prop in r1) {
        if (JSON.stringify(r1[prop]) != JSON.stringify(r2[prop])) {
            changed.push(prop)
        }
    }
    if (changed.length) {
        return changed
    }
    else {
        return false
    }
}

const recipeActions =  {
    
    async doSync () {
        this.syncing = true;
        try {
            await localApi.sync();
        }
        catch (err) {
            console.log('Error syncing :(');
            this.syncing = false;
        }
        console.log('Done syncing')
        recipeActions.getRecipes()
        this.synced = true;
    },

    // async setUser (user) {
    //     this.user = user;
    //     if (!this.synced && !this.syncing && this.user) {
    //         console.log('Sync with the latest data');
    //         this.doSync();
    //     }
    // },

    updateCurrent (recid, rec) {
        //console.log('update',recid,rec);
        if (!get(recipeData)[recid]) {
            return;
        }
        const newChanged = JSON.stringify(diffRecs(rec,get(recipeData)[recid].local))
        const oldChanged = JSON.stringify(get(recipeData)[recid].changed);
        if (newChanged != oldChanged) {
            console.log('Huh, we got a significant change: ',newChanged,'!=',oldChanged)
            updateCount.update(
                (data)=>{
                    console.log('Update count for ',recid);
                    if (!data[recid]) {
                        data[recid] = 1
                    }
                    else {
                        data[recid] += 1;
                    }
                    return data
                }
            );
            recipeData.update(
                (data)=>{
                    data[recid].current = rec;
                    return data;
                }
            );
            recipeActions.checkChanges(recid);
        }
        else {
            console.log('updateCurrent called but there was no change to changed state',recid,oldChanged)
        }
    },

    checkChanges (recid) {
        recipeData.update(
            (d)=>{
                const changed = diffRecs(d[recid].current,
                                          d[recid].local)
                if (changed.length > 0) {
                    d[recid].changed = changed;
                }
                else {
                    d[recid].changed = false
                }
                return d;
            }
        );
    },

    async createRecipe (recipe) {
        setLocalFetchState({state:'creating',recipe});
        let recid = await localApi.addRecipe(recipe);
        recipeData.update((data)=>{
            setLocalFetchState({state:'done',newId:recid,recipe})
            updateLocalData(
                data,
                recid,
                {local:recipe}
            );
            return data;
        });
    },

    async updateRecipe (recipe) {
        recipe = sanitize(recipe)
        setLocalFetchState({state:'updating',recipe:recipe})
        try {
            let recid = await localApi.updateRecipe(recipe)
            recipeData.update((data)=>{
                recipe.id = recid
                updateLocalData(
                    data,
                    recid,
                    {local:recipe,
                     localState:{state:'updated',saved:new Date()}
                    });
                return data
            });
            setLocalFetchState({state:'updated',id:recipe.id,saved:new Date()});
        }
        catch (err) {
            recipeData.update((data)=>{
                updateLocalData(data,
                                recipe.id,
                                {localState:{state:'errorUpdating',error:err}}
                               )                
                console.log(err)
                return data;
            });
            setLocalFetchState({state:'errorUpdating',error:err,recipe})
        }
    },

    async saveDraft (recipe) {
    },

    async getRecipes ({query,fields,limit,page,initial=false}={}) {
        setLocalFetchState({state:'fetching',query,page,limit});
        let response = await localApi.getRecipes({query,fields,limit,page});
        let now = new Date();
        recipeData.update(
            (data)=>{
                if (initial) {
                    response.result.forEach(
                        (rec)=>{
                            console.log('got response',rec);
                            updateLocalData(data,rec.id,{local:rec,fetched:now});
                        }
                    );
                }
                data.searchResults = response.result;
                return data;
            });
        setLocalFetchState({state:'fetched',query,page,limit,response})
    },

    async getRecipe (id) {
        let rec = await localApi.getRecipe(id)
        recipeData.update((data)=>{
            updateLocalData(data,id,{local:rec})
            return data;
        });
    },

    trashRecipe (recipe) {
    },

    async deleteRecipe (id) {
        console.log('RD say delete',id)
        try {
            await localApi.deleteRecipe(id);
            setLocalFetchState({state:'deleted',id:id})
            recipeData.update((data)=>{delete data[id]; return data});
        }
        catch (err) {
            setLocalFetchState({state:'deletionError',error:err},id)
        }
    },

    syncToRemote () {
    },
            
    syncFromRemote () {
    },

    checkForChanges (recipe) {
    }

};

    
export {recipeData,recipeActions,connected,fetchData,updateCount}

    
