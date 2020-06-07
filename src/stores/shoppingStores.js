import { readable, writable, get, derived } from 'svelte/store';
import { localRecipes, recipeActions } from './recipeStores.js';
import api from '../data/api.js';
import deepcopy from 'deepcopy';

let storedShopRec = writable() // holds stored copy of recipe
let localShopRec = writable() // holds the shopping list recipe


let sl = derived(
    [localShopRec,localRecipes],
    async ([$localShopRec,$localRecipes],set) => {
        if (!$localShopRec) {
            set([]);
        }
      console.log('Crawling recipes for ingredients...',$localShopRec,new Date().getTime());
        let allItems = [];
        await crawlIngredients($localShopRec.ingredients,$localShopRec,$localRecipes,allItems);
        set(allItems);
        console.log('Set!',allItems.length,'items',new Date().getTime());
    }
);

async function crawlIngredients (ingredientList,source,$localRecipes,items) {
  // TODO - check for circular references...
  console.log('Crawl',ingredientList.length,'items',new Date().getTime());
  for (let ingredient of ingredientList) {
    if (ingredient.ingredients) {
      console.log('Crawl group...')
      await crawlIngredients(ingredient.ingredients,source,$localRecipes,items);
    } else if (ingredient.reference) {
      console.log('Lookup recipe for ',ingredient.reference);
      let recipe = $localRecipes[ingredient.reference];
      if (!recipe) {
        console.log('Fetch sub-rec...');
        recipe = await localRecipes.open(ingredient.reference);
      }
      if (recipe && recipe.ingredients) {
        crawlIngredients(recipe.ingredients,recipe,$localRecipes,items);
      }
      else {
      console.log('WARNING: DID NOT FIND LINKED RECIPE FOR ITEM',ingredient,'from',source);
      }
    } else {
      items.push({source,ingredient});
    }
  }
}


export const shoppingList = {
    getShoppingRecipeId () {
        return get(storedShopRec).id;
    },
    async get () {
        // Look for an existing shopping list recipe...
        let r;
        let {result,count} = await api.getRecipes(
            {query:{isShoppingList:true}}
        );
        //let count = 0; let result;
        if (count) {
            r = result[0];
        } else {
            // If it doesn't exist, create one...
            r = await recipeActions.createRecipe(
                {title:'Shopping List',
                 ingredients:[],
                 isShoppingList:1}
            )
            
        }
        // make local copy...
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
    updateRecipeQuantity (id) {
    },
    /* Add custom item to shopping list */
    addItem (ingredient) {
        let id = 'FIXME';
        return id;
    },
    /* Remove custom item from shopping list */
    removeItem (id) {
    },
    /* Update recipe list item */
    updateItem (shoppingItem) {
        
    },
    save () {
        
    },
    subscribe : sl.subscribe,
}
