import { writable,get } from 'svelte/store';
import localApi from '../data/api.js';
import deepcopy from 'deepcopy';

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
    return {title:recipe.title,
            text:recipe.text||{},
            properties:recipe.properties||{},
            ingredients:recipe.ingredients&&recipe.ingredients.map(sanitizeIngredient)||[],
            images:recipe.images||{},
            id:recipe.id
           }; // only the stuff we care about

    function sanitizeIngredient (i) {
        i = {...i}
        delete i.awidth;
        delete i.uwidth;
        delete i.iwidth;
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

    
    setUser (user) {
        this.user = user;
    },

    updateCurrent (recid, rec) {
        console.log('update',recid,rec);
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
        let recid = await localApi.addRecipe(recipe,this.user);
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
            let recid = await localApi.updateRecipe(recipe,this.user)
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

    async getRecipes ({search=undefined,
                         page=undefined,
                         count=20,
                      }={}) {
        setLocalFetchState({state:'fetching',search,page,count});
        let response = await localApi.getRecipes(search,this.user);
        let now = new Date();
        recipeData.update(
            (data)=>{
                response.result.forEach(
                    (rec)=>{
                        console.log('got response',rec);
                        updateLocalData(data,rec.id,{local:rec,fetched:now});
                    }
                );
                return data;
            });
        setLocalFetchState({state:'fetched',search,page,count,response})
    },

    async getRecipe (id) {
        let rec = await localApi.getRecipe(id,this.user)
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
            await localApi.deleteRecipe(id,this.user);
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

    
