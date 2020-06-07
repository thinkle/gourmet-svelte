import { readable, writable, get, derived } from 'svelte/store';
import { makeLocalRecipeStore, recipeActions } from './recipeStores.js';
import api from '../data/api.js';
import deepcopy from 'deepcopy';

const {localRecipes,recipeState} = makeLocalRecipeStore();

export let storedShopRec = writable() // holds stored copy of recipe
let localShopRec = writable() // holds the shopping list recipe


let sl = derived(
    [localShopRec,localRecipes],
    async ([$localShopRec,$localRecipes],set) => {
        console.log('Re-create derived shopping list store');
        if (!$localShopRec) {
            set([]);
        } else {
            //console.log('Crawling recipes for ingredients...',$localShopRec,new Date().getTime());
            let allItems = [];
            await crawlIngredients($localShopRec.ingredients,$localShopRec,$localRecipes,allItems);
            set(allItems);
            //console.log('Set!',allItems.length,'items',new Date().getTime());
        }
    }
);

async function crawlIngredients (ingredientList,source,$localRecipes,items,multiplier) {
    // TODO - check for circular references...
    //console.log('Crawl',ingredientList.length,'items',new Date().getTime());
    for (let ingredient of ingredientList) {
        if (ingredient.ingredients) {
            //console.log('Crawl group...')
            await crawlIngredients(ingredient.ingredients,source,$localRecipes,items,multiplier);
        } else if (ingredient.reference) {
            //console.log('Lookup recipe for ',ingredient.reference);
            let recipe = $localRecipes[ingredient.reference];
            if (!recipe) {
                //console.log('Fetch sub-rec...');
                recipe = await localRecipes.open(ingredient.reference);
            }
            if (recipe && recipe.ingredients) {
                let recMultiplier
                if (ingredient.amount && ingredient.amount.amount && ingredient.amount.amount != 1) {
                    recMultiplier = ingredient.amount.amount
                }
                crawlIngredients(recipe.ingredients,recipe,$localRecipes,items,recMultiplier);
            }
            else {
                //console.log('WARNING: DID NOT FIND LINKED RECIPE FOR ITEM',ingredient,'from',source);
            }
        } else {
            items.push({source,ingredient,multiplier});
        }
    }
}


export const shoppingList = {
    getShoppingRecipeId () {
        debugger;
        let $sr = get(storedShopRec)
        if (!$sr) {
            return undefined
        } else {
            return $sr.id;
        }
    },
    async get () {
        // Look for an existing shopping list recipe...
        let r;
        let {result,count} = await api.getRecipes(
            {query:{isShoppingList:true}}
        );
        //let count = 0; let result;
        if (count) {
            console.log('using stored SL, search results:',result,count);
            r = result[0];
        } else {
            console.log('Creating SL anew');
            // If it doesn't exist, create one...
            r = await recipeActions.createRecipe(
                {title:'Shopping List',
                 ingredients:[],
                 isShoppingList:1}
            )
            console.log('Created',r);
        }
        // make local copy...
        console.log('Storing',r);
        storedShopRec.update(()=>r);
        localShopRec.update(()=>deepcopy(r));
    },


    clear () {
        localShopRec.update(
            ($r)=>{
                $r.ingredients = [];
                return $r;
            }
        );
    },
    
    /**
       Add recipe to shopping list
    **/
    async addRecipe (id, quantity) {
        // maybe a problem down the road? We might not want to open all these recipes...
        // We could basically make a copy of the local recipes store here...
        let recipe = await localRecipes.open(id);
        let ingredient = {
            amount : {
                amount : 1,
                unit : 'recipe'
            },
            item : recipe.title,
            reference : id
        }
        localShopRec.update(
            ($localShopRec)=>{
                $localShopRec.ingredients.push(ingredient);
                return $localShopRec;
            }
        );
    },
    /**
       Remove recipe from shopping list
    **/
    removeRecipe (id, quantity) {
        localShopRec.update(
            ($localShopRec) => {
                $localShopRec.ingredients = $localShopRec.ingredients.filter(
                    (item)=>item.reference != id
                );
                return $localShopRec;
            }
        );
    },
    /**
       Update quantity of a recipe on our shopping list
    **/
    updateRecipeQuantity (id, quantity) {
        localShopRec.update(
            ($localShopRec) => {
                let ing = $localShopRec.ingredients.find((i)=>i.reference==id);
                if (!ing) {
                    throw new Error(`No recipe on list with ID ${id}: ${$localShopRec.ingredients}`);
                }
                ing.amount.amount = quantity;
                return $localShopRec;
            }
        );
    },

    setShopItem (item, shopItem) {
        if (!item.source) {
            throw new Error('item must have source to change shopitem');
        }
        if (!item.source.id) {
            throw new Error('item source must have ID to change shopitem');
        }
        item.ingredient.shopItem = shopItem; // the object is actually attached to our local recipe anyway...
        localRecipes.update(
            ($localRecipes)=>{
                $localRecipes[item.source.id] = $localRecipes[item.source.id];
                return $localRecipes;
            }
        );

    },
    
    /* Add custom item to shopping list */
    addItem (ingredient) {
        return new Promise((resolve,reject)=>{
            let id = 0;
            localShopRec.update(
                ($localShopRec)=>{
                    if (!$localShopRec) {
                        reject(`No shopping list loaded: $localShopRec falsey ${$localShopRec}`);
                    }
                    if (!$localShopRec.ingredients) {
                        reject(`$localShopRec does not have an ingredient list defined? ${$localShopRec}`);
                    }
                    $localShopRec.ingredients.forEach(
                        (i)=>{if (i.id>id) {id = i.id+1}}
                    );
                    $localShopRec.ingredients.forEach(
                        (i)=>{if (!i.id) {i.id = id+1; id+=1}}
                    );
                    ingredient.id = id;
                    $localShopRec.ingredients.push(ingredient);
                    resolve(id);
                    return $localShopRec;
                }
            );
        });
    },
    /* Remove custom item from shopping list */
    removeItem (id) {
        localShopRec.update(
            ($localShopRec)=>{
                $localShopRec.ingredients = $localShopRec.ingredients.filter(
                    (i)=>i.id != id
                );
            }
        );
    },

    /* Update recipe list item */
    updateItem (shoppingItem) {
        return new Promise((resolve,reject)=>{
            localShopRec.update(
                ($localShopRec)=>{
                    let replaced
                    $localShopRec.ingredients = $localShopRec.ingredients.map(
                        (i)=>{
                            if (i.id == shoppingItem.id) {
                                replaced = true;
                                return shoppingItem;
                            }
                            else {
                                return i
                            }
                        });
                    if (replaced) {resolve($localShopRec.ingredients)}
                    else {reject(`No item with ID ${id} found in ${$localShopRec.ingredients}`)}
                }
            ); // end update
        }); // end promise
    },


    async save () {
        // FIX ME
        let result = await api.updateRecipe(get(localShopRec))
        storedShopRec.update(()=>result);
        return result;
    },
    
    subscribe : sl.subscribe,
}
