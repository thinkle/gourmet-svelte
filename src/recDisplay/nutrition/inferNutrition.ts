import type { Ingredient, Amount } from "../../types/ingredientTypes";
import type { Nutrient, NutrientQueryResult } from "../../types/nutrientTypes";
import { getGramWeight, getML } from "../../utils/unitAmounts";
import { getNutritionQuery, extractItems } from "../../utils/ingredientUtils";
import { getNutrientById } from "./nutrientUtils";
import prepWords from "../../utils/ingPrepWords";
import stopword from "stopword";
import { unique } from "../../utils/uniq.js";

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
];

function rankNutrientMatch(
  nutrient: Nutrient & { rank?: number },
  ing: Ingredient
): number {
  let rank = 0;
  for (let word of unique(
    stopword.removeStopwords(nutrient.description.toLowerCase().split(/\s+/))
  )) {
    // Matching words are good
    if (ing.text.toLowerCase().indexOf(word) > -1) {
      if (prepWords.indexOf(word) > -1) {
        rank += 25; // less good if prep word
        if (nutrient.fdcId == 1545246) {
          console.log("+25 for", word);
        }
      } else {
        rank += 200;
        if (nutrient.fdcId == 1545246) {
          console.log("+200 for", word);
        }
      }
    } else if (ing?.amount?.unit && ing.amount.unit.indexOf(word) > -1) {
      rank += 25;
    } else if (word.search(/\w/) > -1) {
      // non matching words are bad...
      rank -= 50;
      if (nutrient.fdcId == 1545246) {
        console.log("-50 for", word);
      }
    }
  }
  if (nutrient.fdcId == 1545246) {
    console.log("Rank after words", rank);
  }
  for (let word of unique(stopword.removeStopwords(ing.text.split(/\s+/)))) {
    word = word.toLowerCase();
    if (prepWords.indexOf(word) == -1) {
      if (
        (nutrient.description?.toLowerCase() || "").indexOf(word) == -1 &&
        (nutrient.additionalDescriptions?.toLowerCase() || "").indexOf(word) ==
          -1 &&
        (nutrient.commonNames?.toLowerCase() || "").indexOf(word) == -1
      ) {
        rank -= 10;
      }
    }
  }
  if (nutrient.fdcId == 1545246) {
    console.log("Rank after looking for ing.text in nutrient...", rank);
  }
  for (let ingredientWord of ingredientWordScores) {
    if (
      nutrient.description.search(ingredientWord.match) > -1 &&
      (!ing.text || ing.text.search(ingredientWord.match) == -1)
    ) {
      rank += ingredientWord.score;
    }
  }
  if (nutrient.fdcId == 1545246) {
    console.log("Rank after ingredientWordScores...", rank);
  }
  if (nutrient.description.indexOf(ing.text) > -1) {
    rank += 150;
  }
  if (ing.text.indexOf(nutrient.description) > -1) {
    rank += 150;
  }
  if (nutrient.fdcId == 1545246) {
    console.log("Final rank", rank);
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
        return i;
      } else {
        let item = await getUSDAItemForIngredient(i, QueryTypes.BRANDED);
        if (item) {
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
): Promise<Nutrient | null> {
  console.log("getLocal not implemented...");
  return null;
}

async function getUSDAItemForIngredient(
  i: Ingredient,
  queryType = QueryTypes.GENERAL
): Promise<Nutrient | null> {
  let query = getNutritionQuery(i.text, true);
  let response = await queryUSDANutrients(query, 1, queryType);
  console.log("Got response", response);
  let best = 0;
  let result: Nutrient | null;
  for (let food of response.foods) {
    let score = rankNutrientMatch(food, i);
    if (score > 0 && score > best) {
      best = score;
      result = food;
    }
  }
  if (result) {
    console.log("Inferred!", result, "for", i);
  } else {
    console.log("No dice for", i);
    console.log(response.foods);
  }
  return result;
}
