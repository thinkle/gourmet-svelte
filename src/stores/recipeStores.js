/***
    Attempting a total rewrite of recipe stores.
***/
import { readable,writable,get,derived } from 'svelte/store';
import {tick} from 'svelte'
import api from '../data/api.js';
import deepcopy from 'deepcopy'
const stored = writable({});
const local = writable({});
const activePage = writable([]);
const actionState = writable({}) // for e.g. "searching recipes..."
const individualActionState = writable({}) // for e.g. updating recipe #123124
export const connected = readable(false,(set)=>{
    api.connect().then(
        ()=>{
            set(true)
        }
    );
});
function ssp (store,p,v) {
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

export const localRecipes = {
    open (id) {
        return new Promise((resolve,reject)=>{
            const storedRec = get(storedRecipes)[id]
            if (!storedRec) {
                throw 'No stored recipe exists!'
            }
            else {
                local.update(
                    (lr)=>{
                        lr[id] = deepcopy(storedRec);
                        return lr;
                    }
                );
                tick().then(resolve);
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

export const openLocalRecipes = derived(local,($local)=>{
    console.log('regenerate open...');
    return Object.keys($local)
}
);

export const storedRecipes = {
    subscribe : stored.subscribe,
}
export const recipePage = {
    subscribe : activePage.subscribe,
    
}

export const recipeActions = {

    async doSync () {
        await api.sync(true,{onPartialSync:(recipes)=>{
            recipeActions.getRecipes({limit:recipes.length});
        }}); // test mode
        await recipeActions.getRecipes({limit:50});
    },

    async createRecipe (r) {
        ssp(actionState,'creating',true)
        let recipe = await api.addRecipe(r);
        setStoredRec(recipe);
        tick()
        localRecipes.open(recipe.id);
        ssp(actionState,'creating',false)
        ssp(actionState,'created',recipe.id)
    },
    async getRecipes ({query,fields,limit,page}) {
        ssp(actionState,'querying',{query,fields,limit,page});
        let response = await api.getRecipes({query,fields,limit,page});
        setStoredRecs(response.result);
        activePage.set(response.result.map((r)=>r.id));
        ssp(actionState,'querying',false);
    },
    async updateRecipe (recipe) {
        let updatedRecipe = await api.updateRecipe(recipe);
        setStoredRec(updatedRecipe);
        console.log('updated Recipe!');
    },

    async revertRecipe (id) {
        let storedRecipe = get(stored)[id]
        console.log('Revert to: ',storedRecipe)
        ssp(local,id,deepcopy(storedRecipe));
        console.log('Reverted!')
    },

    async deleteRecipe (id) {
        console.log('RD say delete',id)
        await api.deleteRecipe(id);            
        stored.update((data)=>{delete data[id]; return data});
        local.update((data)=>{delete data[id]; return data});
    },

}

export const recipeActionGeneralState = {
    subscribe : actionState.subscribe
}
export const recipeActionState = {
    subscribe : individualActionState.subscribe
}
export const recipeState = derived(
    [local,stored],
    ([$local,$stored])=>{
        let recState = {}
        for (let key in $local) {
            recState[key] = {} //...$state[key])}
            if (JSON.stringify($local[key]) !== JSON.stringify($stored[key])) {
                if (!recState[key].edited) {
                    let o1 = $local[key];
                    let o2 = $stored[key];
                    
                }
                recState[key].edited = true;
            }
            else {
                recState[key].edited = false;
            }
        }
        console.log('RECIPE STATE STORE: update state');
        return recState;
    }
);
    
