import { get } from "svelte/store";
import type { Ingredient, Amount } from "../../types/ingredientTypes";
import type {
  Nutrient,
  Portion,
  UsdaPortion,
  NutrientQueryResult,
} from "../../types/nutrientTypes";
import { getGramWeight, getML } from "../../utils/unitAmounts";
import { getNutritionQuery, extractItems } from "../../utils/ingredientUtils";
import { getNutrientById } from "./nutrientUtils";
import { nutrients } from "../../stores/nutritionStores";
import prepWords from "../../utils/ingPrepWords";
import stopword from "stopword";
import { unique } from "../../utils/uniq";
import { areSimilar } from "../../utils/textUtils";
import dexieApi from "../../data/local/dexieApi";

import {
  queryUSDANutrients,
  queryMongoNutrients,
  queryLocalNutrients,
  QueryTypes,
} from "../../data/nutritionData";

const KCAL = 1008;

const ingredientWordScores = [
  { match: /\braw/i, score: 150 },
  { match: /\bflesh/i, score: 100 },
  { match: /\bprepared/i, score: -200 },
  { match: /\bsnack/i, score: -200 },
  { match: /\b(fri|bak|cook|boil)ed/i, score: -200 },
  { match: /\bmix/i, score: -200 },
  { match: /\bbabyfoo/i, score: -500 },
  { match: /\brestaurant/i, score: -300 },
  { match: /\bfast\s+food/i, score: -500 },
];

function rankNutrientMatch(
  nutrient: Nutrient & { rank?: number; matchInfo?: {} },
  ing: Ingredient
): number {
  let rank = 0;
  for (let word of unique(
    stopword.removeStopwords(
      nutrient.description.toLowerCase().split(/[,.;:]*\s+[,.;:]*/)
    )
  )) {
    let similarity = areSimilar(word, ing.text);
    let unitSimilarity = areSimilar(word, ing.amount?.unit);
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
    if (!similarity && !unitSimilarity) {
      // non matching words are bad...
      if (prepWords.indexOf(word) > -1) {
        rank -= 15;
      } else {
        rank -= 50;
      }
    }
  } // end each description word
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
      rank += 100;
    } else if (areSimilar(nutrient.additionalDescriptions, word)) {
      matchesSomething = true;
      rank += 100;
    } else if (areSimilar(nutrient.description, word)) {
      matchesSomething = true;
    }
    if (!matchesSomething) {
      rank -= 50;
    }
  }

  for (let ingredientWord of ingredientWordScores) {
    if (
      ((nutrient.description &&
        nutrient.description.search(ingredientWord.match) > -1) ||
        (nutrient.foodCategory?.description &&
          nutrient.foodCategory?.description.search(ingredientWord.match) >
            -1)) &&
      ing.text?.search(ingredientWord.match) == -1
    ) {
      rank += ingredientWord.score;
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

export async function inferGramWeightForIngredient(
  i: Ingredient
): Promise<Amount | { gramWeight?: number; inferred_gramWeight?: number }> {
  if (i.amount.gramWeight) {
    return null;
  } else {
    let inferred: {
      gramWeight: number;
      density?: number;
      isWeight: boolean;
    } | null = getGramWeight(i.amount);
    if (inferred) {
      if (inferred.isWeight) {
        // already a weight, nothing to do
        return {
          gramWeight: inferred.inferred_gramWeight,
        };
      } else {
        // we need density
        let fdcId = i.fdcId || i.inferred_fdcId;
        if (fdcId) {
          let nutrient = await getDetailedNutrient(fdcId);
          if (nutrient.densities?.length) {
            let nutrientBasedWeight = getGramWeight(
              i.amount,
              nutrient.densities[0].amount.density
            );
            return {
              inferred_gramWeight: nutrientBasedWeight.gramWeight,
            };
          }
        }
        return {
          inferred_gramWeight: inferred.gramWeight,
        };
      }
    } else if (i.fdcId || i.inferred_fdcId) {
      // not a weight or volume...
      let nutrient = await getDetailedNutrient(i.fdcId || i.inferred_fdcId);
      if (nutrient.foodPortions) {
        let portion = pickBestPortion(nutrient.foodPortions, i);
        if (portion) {
          let portionNumber = portion.amount?.amount || 1;
          let ingredientNumber = i?.amount?.amount || 1;
          let multiplier = ingredientNumber / portionNumber;
          return {
            inferred_gramWeight: portion.gramWeight * multiplier,
          };
        }
      }
    }
  }
}

/* NOTE TO SELF: Figure out how we populate the $nutrients store in the first place and somehow
miss the portions when we do so :) */

function pickBestPortion(
  portions: UsdaPortion[],
  i: Ingredient
): UsdaPortion | void {
  if (portions.length == 1) {
    return portions[0]; // just pick the only one if there is only one...
  }
  let bestScore = -10;
  let bestMatch = undefined;
  for (let portion of portions) {
    let score = 0;
    score += 10 * areSimilar(portion.modifier, i.amount?.unit);
    score += 10 * areSimilar(i.text, portion.modifier);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = portion;
    }
  }
  return bestMatch;
}

async function getDetailedNutrient(fdcId: number): Promise<Nutrient> {
  await nutrients.fetchDetails({ fdcId: fdcId });
  let $nutrients = get(nutrients);
  let nutrient = $nutrients[fdcId];
  return nutrient;
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
