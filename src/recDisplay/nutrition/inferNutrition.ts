import type { Ingredient, Amount } from "../../types/ingredientTypes";
import type { Nutrient, NutrientQueryResult } from "../../types/nutrientTypes";
import { getGramWeight, getML } from "../../utils/unitAmounts";
import { getNutritionQuery, extractItems } from "../../utils/ingredientUtils";
import { getNutrientById } from "./nutrientUtils";
import prepWords from "../../utils/ingPrepWords";
import stopword from "stopword";

const KCAL = 1008;

const ingredientWordScores = [
  { match: /\braw/i, score: 150 },
  { match: /\bflesh/i, score: 100 },
  { match: /\bprepared/i, score: -200 },
  { match: /\bsnack/i, score: -200 },
  { match: /\b(fri|bak|cook|boil)ed/i, score: -200 },
  { match: /\bmix/i, score: -200 },
  { match: /\bbabyfoo/i, score: -500 },
];

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
  flatResults.sort((a, b) => rank(b) - rank(a));
  return flatResults;

  function rank(nutrient: Nutrient & { rank?: number }): number {
    let rank = 0;
    for (let word in stopword.removeStopwords(
      nutrient.description.toLowerCase().split(/\s+/)
    )) {
      // Matching words are good
      if (ing.text.indexOf(word) > -1) {
        if (prepWords.indexOf(word) > -1) {
          rank += 25; // less good if prep word
        } else {
          rank += 100;
        }
      } else if (ing?.amount?.unit && ing.amount.unit.indexOf(word) > -1) {
        rank += 25;
      } else {
        // non matching words are bad...
        rank -= 50;
      }
    }
    for (let word in stopword.removeStopwords(ing.text.split(/\s+/))) {
      word = word.toLowerCase();
      if (prepWords.indexOf(word) == -1) {
        if (
          (nutrient.description || "").indexOf(word) == -1 &&
          (nutrient.additionalDescriptions || "").indexOf(word) == -1 &&
          (nutrient.commonNames || "").indexOf(word) == -1
        ) {
          rank -= 10;
        }
      }
    }
    for (let ingredientWord of ingredientWordScores) {
      if (
        nutrient.description.search(ingredientWord.match) > -1 &&
        (!ing.text || ing.text.search(ingredientWord.match) == -1)
      ) {
        rank += ingredientWord.score;
      }
    }
    if (nutrient.description.indexOf(ing.text) > -1) {
      rank += 150;
    }
    if (ing.text.indexOf(nutrient.description) > -1) {
      rank += 150;
    }
    nutrient.rank = rank;
    return rank;
  }
}

export async function inferNutrientForIngredient(
  i: Ingredient
): Promise<Ingredient> {
  if (i.fdcId) {
    return i;
  } else {
    let item = await getLocalNutrientForIngredient(i);
    if (item) {
      i.inferred_fdcId = item;
      return i;
    } else {
      let item = await getNotBrandedItemForIngredient(i);
      if (item) {
        i.inferred_fdcId = item;
        return i;
      } else {
        let item = await getBrandedItemForIngredient(i);
        if (item) {
          i.inferred_fdcId = item;
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
    let inferred = getGramWeight(i.amount);
    if (inferred != i.amount.inferred_gramWeight) {
      if (inferred.isWeight) {
        return {
          gramWeight: inferred.inferred_gramWeight,
        };
      } else {
        return {
          inferred_gramWeight: inferred.gramWeight,
        };
      }
    }
  }
}

async function getLocalNutrientForIngredient(
  i: Ingredient
): Promise<number | null> {
  console.log("getLocal not implemented...");
  return null;
}

/**
 * @param  {import("../../types/ingredientTypes").Ingredient} i
 * @return Promise<number | null>
 **/
async function getNotBrandedItemForIngredient(
  i: Ingredient
): Promise<number | null> {
  throw new Error("Function not implemented.");
}

/**
 * @param  {import("../../types/ingredientTypes").Ingredient} i
 * @return number | null
 **/
function getBrandedItemForIngredient(i: Ingredient): Promise<number | null> {
  throw new Error("Function not implemented.");
}
