import type { Ingredient } from "../../types/ingredientTypes";
import type {
  Nutrient,
  UsdaPortion,
  NutrientQueryResult,
} from "../../types/nutrientTypes";
import { getML } from "../../utils/unitAmounts";
import { getNutritionQuery, extractItems } from "../../utils/ingredientUtils";
import { getNutrientById } from "./nutrientUtils";
import { nutrients } from "../../stores/nutritionStores";
import prepWords from "../../utils/ingPrepWords";
import stopword from "stopword";
import { unique } from "../../utils/uniq";
import { areSimilar } from "../../utils/textUtils";
import dexieApi from "../../data/local/dexieApi";
export { inferGramWeightForIngredient } from "./inferGramWeight";
import {
  queryUSDANutrients,
  queryMongoNutrients,
  queryLocalNutrients,
  QueryTypes,
} from "../../data/nutritionData";

const KCAL = 1008;

const ingredientWordScores = [
  { match: /\braw|fresh\b/i, score: 500 },
  { match: /\bflesh\b/i, score: 100 },
  { match: /\bprepared\b/i, score: -200 },
  { match: /\bsnack/i, score: -200 },
  { match: /\b(fri|bak|cook|boil)ed/i, score: -200 },
  { match: /\bmix/i, score: -200 },
  { match: /\bbabyfoo/i, score: -500 },
  { match: /\brestaurant/i, score: -300 },
  { match: /\bfast\s+food/i, score: -500 },
  { match: /\bsweets\b/i, score: -100 },
];

function rankNutrientMatch(
  nutrient: Nutrient & { rank?: number; matchInfo?: {} },
  ing: Ingredient
): number {
  let rank = 0;
  for (let desc of [
    nutrient.description,
    nutrient.commonNames,
    nutrient.additionalDescriptions,
  ]) {
    if (desc) {
      for (let word of unique(
        stopword.removeStopwords(desc.toLowerCase().split(/[,.;:]*\s+[,.;:]*/))
      )) {
        let similarity = areSimilar(word, ing.text);
        let unitSimilarity = 0;
        if (ing?.amount?.unit && ing.amount.unit.length > 3) {
          // ignore things like "g" and "c" and "tsp"
          unitSimilarity = areSimilar(word, ing.amount?.unit);
        }
        if (similarity) {
          if (prepWords.indexOf(word) > -1) {
            rank += similarity * 10;
          } else {
            rank += similarity * 100;
          }
        }
        if (unitSimilarity) {
          rank += unitSimilarity * 10;
        }
        if (!similarity && !unitSimilarity && desc == nutrient.description) {
          // non matching words are bad...
          if (prepWords.indexOf(word) > -1) {
            rank -= 15;
          } else {
            rank -= 50;
          }
        }
      } // end each description word
    }
  }
  // If we have words in our ingredient and they are nowhere, that is bad
  let ingWords = unique(
    ing.text.split(/[,.;:]*\s+/).map((w) => w.toLowerCase())
  );
  ingWords = stopword.removeStopwords(ingWords);
  ingWords = stopword.removeStopwords(ingWords, prepWords);
  for (let word of ingWords) {
    let matchesSomething = false;
    if (areSimilar(nutrient.commonNames, word)) {
      matchesSomething = true;
    } else if (areSimilar(nutrient.additionalDescriptions, word)) {
      matchesSomething = true;
    } else if (areSimilar(nutrient.description, word)) {
      matchesSomething = true;
    }
    if (!matchesSomething) {
      rank -= 50;
    }
  }

  for (let ingredientWord of ingredientWordScores) {
    let match = false;
    if (nutrient.description) {
      match = nutrient.description.search(ingredientWord.match) > -1;
    }
    if (!match && nutrient.foodCategory) {
      let fc = nutrient.foodCategory;
      if (fc.description) {
        fc = fc.description;
      } // on "detailed" ingredients we have an object, otherwise not.
      match = fc.search(ingredientWord.match) > -1;
    }
    let ingMatch = ing.text?.search(ingredientWord.match) > -1;
    if (match && !ingMatch) {
      rank += ingredientWord.score;
    } else if (match) {
      console.log(
        "Ignoring match",
        ingredientWord,
        nutrient,
        ing,
        ingMatch,
        match
      );
    }
  }
  if (nutrient.matchInfo) {
    if (!nutrient.matchInfo.inferred) {
      rank += 10000;
    }
  }
  nutrient.rank = rank;
  return rank;
}

export function sortQueryResultsForIngredient(
  ing: Ingredient,
  queryResults: NutrientQueryResult[]
) {
  let flatResults: Nutrient[] = [];
  queryResults.forEach((qr) => {
    flatResults = [...flatResults, ...qr.foods];
  });
  // remove any results with no calories and remove duplicates
  const ids = {};
  flatResults = flatResults.filter((n) => {
    let kcal = getNutrientById(n, KCAL);
    if (ids[n.fdcId]) {
      return false;
    } else {
      ids[n.fdcId] = n;
    }
    if (kcal.type === "missing") {
      return false;
    } else {
      return true;
    }
  });
  flatResults.sort(
    (a, b) => rankNutrientMatch(b, ing) - rankNutrientMatch(a, ing)
  );
  return flatResults;
}

export async function inferNutrientForIngredient(
  i: Ingredient
): Promise<Ingredient> {
  if (i.fdcId) {
    return i;
  } else {
    let item = await getLocalNutrientForIngredient(i);
    if (item) {
      i.inferred_fdcId = item.fdcId;
      return i;
    } else {
      let item = await getUSDAItemForIngredient(i, QueryTypes.GENERAL);
      if (item) {
        i.inferred_fdcId = item.fdcId;
        saveNutrientLocally(item, i, true);
        return i;
      } else {
        let item = await getUSDAItemForIngredient(i, QueryTypes.BRANDED);
        if (item) {
          saveNutrientLocally(item, i, true);
          i.inferred_fdcId = item.fdcId;
          return i;
        }
      }
    }
  }
  return i;
}

async function getLocalNutrientForIngredient(
  i: Ingredient
): Promise<Nutrient | null> {
  let response = await queryLocalNutrients(i.text);
  return pickBestFood(response.foods, i);
}

async function getUSDAItemForIngredient(
  i: Ingredient,
  queryType = QueryTypes.GENERAL
): Promise<Nutrient | null> {
  let query = getNutritionQuery(i.text, true);
  let response = await queryUSDANutrients(query, 1, queryType);
  console.log("Got response", response);
  let best = 0;
  nutrients.update(($nutrients) => {
    for (let food of response.foods) {
      $nutrients[food.fdcId] = food;
    }
    return $nutrients;
  });
  return pickBestFood(response.foods, i);
}

function pickBestFood(foods: Nutrient[], i: Ingredient): Nutrient | null {
  let result: Nutrient | null = null;
  let best = 0;
  for (let food of foods) {
    nutrients.update(($nutrients) => {
      $nutrients[food.fdcId] = food;
      return $nutrients;
    });
    let score = rankNutrientMatch(food, i);
    if (score > 0 && score > best) {
      best = score;
      result = food;
    }
  }
  console.log("Picking the best for", i, " from ", foods, "=>", result);
  console.log(foods.map((f) => f.rank));
  console.log(result, best);
  return result;
}

export async function saveNutrientLocally(item, ingredient, inferred = true) {
  console.log("store nutrient!", item.storedLocally, item);
  indexNutrient(item);
  // addNutrient adds storedLocally flag
  await dexieApi.addNutrient(item);
  console.log("Added nutrient", item.storedLocally, item);
  await dexieApi.addNutrientRelation(item.fdcId, ingredient, inferred);
}

function indexNutrient(n: Nutrient) {
  n.indexWords = [];
  addWordAndWords(n.description);
  addWordAndWords(n.commonNames);
  addWordAndWords(n.additionalDescriptions);

  function addWordAndWords(w: string): void {
    if (w) {
      let hasSpaces = w.search(/\s+/);
      if (hasSpaces > -1) {
        n.indexWords = [...n.indexWords, w, ...w.split(/\s+/)];
      } else {
        n.indexWords.push(w);
      }
    }
  }
}
