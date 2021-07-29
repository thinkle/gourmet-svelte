/**
dexieApi.js implements the interface for storing recipes in IndexDB

**/

import { prepRecLocal, prepPortionLocal, getWordsFromIng } from  "../utils/validate";
import { extractItems, getShopItem } from "../../utils/ingredientUtils";
import Dexie from "dexie";
import type { Dexie } from "dexie";
import stopword from "stopword";
import type {Nutrient,Portion} from '../../types/nutrientTypes'

export interface Recipe {

}
export interface NutrientRelation {
  fdcId : number,
  ingredient : {
    text : string
  },
  ingredientWords : string[],
  inferred : boolean
}

class DB extends Dexie {
  recipes : Dexie.Table<Recipe, number>,
  nutrientRelations : Dexie.Table<NutrientRelation, number>,
  nutrients : Dexie.Table<Nutrient, number>,
  portions : Dexie.Table<Portion, number>

  constructor () {
    super('Recipes');
    var db = this;
    db.version(17).stores({
      recipes:
        "++id,&_id,*words,*ings,*categoryNames,*sourceNames,isShoppingList,deleted,savedRemote",
      nutrientRelations: "fdcId,ingredient,*ingredientWords,inferred",
      nutrients: "&fdcId,*indexWords",
      portions:
        "&id,*ingredientWords,amount.standardUnit,amount.unit,amount.unitModifier,amount.density,fdcId",
    })
  }
}

let db : null | DB = null;

const dexieApi = {
  db, 
  async connect(): Promise<boolean> {
    dexieApi.db = new DB();    
    return true;
  },

  async addNutrientRelation(fdcId, ingredient, inferred = false) {
    if (!dexieApi.db) {
      await this.connect();
    }
    let ingredientWords = getIngredientIndexWords(ingredient);
    dexieApi.db.nutrientRelations.put({
      fdcId,
      ingredient,
      ingredientWords,
      inferred,
    });
  },

  async addNutrient(nutrient) {
    if (!dexieApi.db) {
      await this.connect();
    }
    nutrient.storedLocally = true;
    return await dexieApi.db.nutrients.put(nutrient);
  },

  async addPortion(portion : Portion) {
    if (!dexieApi.db) {
      await this.connect();
    }    
    portion.storedLocally = true;
    return await dexieApi.db.portions.put(prepPortionLocal(portion));
  },

  addRecipe(recipe) {
    return dexieApi.db.recipes.add(prepRecLocal(recipe));
  },

  async addToRecipe(recipeChanges) {
    const query = {};
    if (recipeChanges.id) {
      query.id = recipeChanges.id;
    } else if (recipeChanges._id) {
      query._id = recipeChanges._id;
    } else {
      throw `NO ID to find recipe by: ${JSON.stringify(recipeChanges)}`;
    }
    let orig = await dexieApi.db.recipes.get(query);
    // All we actually need for our current APP is the ingredients.
    for (let prop in recipeChanges) {
      if (!["id", "_id", "ingredients"].includes(prop)) {
        console.log("warning: local addToRecipe only supports ingredients");
      }
    }
    // Very low tech ingredient merge for now... - no grouping etc. since we're just being used
    // for shopping lists at the moment...
    let ingredients = [...orig.ingredients, recipeChanges.ingredients];
    let result = await dexieApi.db.recipes.update(query, { ingredients });
    if (result == 1) {
      return await dexieApi.db.recipes.get(query);
    } else {
      throw `Update failed: key not found? ${JSON.stringify(query)}`;
    }
  },

  getRecipe(recid, { mongoId } = {}) {
    if (mongoId) {
      return dexieApi.db.recipes.get({ _id: mongoId });
    } else {
      return dexieApi.db.recipes.get({ id: recid });
    }
  },

  async getSources() {
    if (dexieApi.db) {
      return await dexieApi.db.recipes.orderBy("sourcesNames").uniqueKeys();
    } else {
      return [];
    }
  },

  async getCategories() {
    if (dexieApi.db) {
      return await dexieApi.db.recipes.orderBy("categoryNames").uniqueKeys();
    } else {
      return [];
    }
  },

  searchWord(word, { deleted } = {}) {
    let q = dexieApi.db.recipes;
    q = q.where("words").startsWith(word.toLowerCase());
    if (deleted !== undefined) {
      q = q.and((o) => o.deleted == deleted);
    }
    q = q.and((o) => !o.isShoppingList);
    return q;
  },

  async searchWords(words, { deleted } = {}) {
    words = stopword.removeStopwords(words);
    let q = dexieApi.db.recipes;
    var ids = undefined;
    for (let word of words) {
      let subResults = dexieApi.searchWord(word, { deleted });
      let subIds = await subResults.distinct().primaryKeys();
      if (!ids) {
        ids = subIds;
      } else {
        ids = ids.filter((id) => subIds.includes(id));
        if (ids.length == 0) {
          return undefined;
        }
      }
    }
    q = q.where(":id").anyOf(ids);
    q.alreadyCounted = ids.length;
    return q;
  },

  async getRecipes({ query, fields, limit, page, sort } = {}) {
    let q = dexieApi.db.recipes;
    if (query && query.isShoppingList) {
      q = dexieApi.db.recipes.where("isShoppingList").equals(1);
    } else if (query && query.fulltext) {
      // Note: we split words by \s when we full-text index
      query.fulltext = query.fulltext.replace(/^\s+|\s+$/g, "");
      if (query.fulltext.indexOf(" ") > -1) {
        q = await dexieApi.searchWords(
          query.fulltext.split(/\s+/),
          query // this object hands in deleted
        );
      } else {
        q = dexieApi.searchWord(query.fulltext, query);
      }
    } else if (query && query.deleted !== undefined) {
      query.deleted = Number(query.deleted); // no booleans in dexie!
      q = dexieApi.db.recipes
        .where("deleted")
        .equals(query.deleted)
        .and((o) => !o.isShoppingList);
    } else if (query && query.savedRemote !== undefined) {
      q = dexieApi.db.recipes
        .where("savedRemote")
        .equals((query.savedRemote && 1) || 0);
    }
    if (!q) {
      return {
        result: [],
        count: 0,
      };
    }
    if (sort) {
      // ok, we do our own pagination and sorting then...
      // risky? perhaps?
      let allTheResults = await q.toArray();
      allTheResults.sort(getSortFunction(sort));
      let result = allTheResults.slice(
        page || 0,
        (limit && (page || 0) + limit) || undefined
      );
      let last = result.length + (page || 0) >= allTheResults.length;
      return {
        result,
        count: allTheResults.length,
        prevPage: page - (limit || result.length),
        nextPage: result.length + (page || 0),
        currentPage: page || 0,
        last,
      };
    }
    let count;
    if (q.alreadyCounted) {
      count = q.alreadyCounted;
    } else {
      //else if (q.clone) {
      try {
        count = await q.clone().distinct().count();
      } catch (err) {
        //else {
        count = await q.count();
      }
    }
    if (page) {
      q = q.offset(page);
    }
    if (limit) {
      q = q.limit(limit);
    }
    let result = await q.toArray();
    let previousPage = 0;
    if (page && result.length) {
      previousPage = page - (limit || result.length);
    }
    let last = result.length + (page || 0) >= count;
    return {
      result,
      count,
      prevPage: previousPage,
      nextPage: result.length + (page || 0),
      currentPage: page || 0,
      last,
    };
  },

  async updateRecipe(recipe) {
    return await dexieApi.db.recipes.put(prepRecLocal(recipe));
  },
  async updateRecipes(recipes) {
    return await dexieApi.db.recipes.bulkPut(recipes.map(prepRecLocal));
  },
  async deleteRecipe(id) {
    if (id.id) {
      id = id.id; // accept object too
    }
    return await dexieApi.db.recipes.delete(id);
  },
  async queryNutrientRelations (text) {
    let matches = await dexieApi.db.nutrientRelations.where(
      'ingredientWords'
    ).startsWithIgnoreCase(text)
    .sortBy('inferred');    
    let results = [];
    for (let match of matches) {
      let nutrient = await dexieApi.db.nutrients.where('fdcId').equals(match.fdcId)
      .first();      
      results.push({
        nutrient,
        match
      })
    }    
    return results;
  }
};



export function getIngredientIndexWords(ingredient: any) {
  let ingredientWords = [
    getShopItem(ingredient),
    ingredient.text,
    ...extractItems(ingredient.text),
  ];
  ingredientWords = ingredientWords.map((w) => w.toLowerCase());
  if (ingredient.ingKey) {
    ingredientWords.push(ingredient.ingKey);
  }
  return ingredientWords;
}

function getSortFunction(sort) {
  if (typeof sort == "function") {
    return sort;
  } else {
    if (typeof sort == "string") {
      return (a, b) =>
        (a[sort] > b[sort] && 1) || (b[sort] > a[sort] && -1) || 0;
    } else if (sort.prop && sort.reverse) {
      return (a, b) =>
        (b[sort.prop] > a[sort.prop] && 1) ||
        (a[sort.prop] > b[sort.prop] && -1) ||
        0;
    } else if (sort.prop) {
      return getSortFunction(sort.prop);
    }
  }
}

export default dexieApi;
