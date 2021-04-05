import { getStandardUnit } from "./unitAmounts";
import stopword from "stopword";
/**
 * @param  {} portion
 * @param  Ingredient ing
 */
export function scorePortion(portion, ing) {
  let fdcId = ing.fdcId || ing.inferred_fdcId;
  let score = 0;
  if (portion.fdcId == fdcId) {
    score += 1000;
  }
  let ingWords = [];
  if (ing.text) {
    let ingWords = stopword.removeStopwords(
      ing.text.toLowerCase().split(/\s+/)
    );
    for (let word of ingWords) {
      if (portion.foodDescription.toLowerCase().indexOf(word) > -1) {
        score += 20;
      }
      if (
        portion.amount?.unitModifier &&
        portion.amount.unitModifier.indexOf(word) > -1
      ) {
        score += 10;
      }
    }
    // Subtract points for words in food description NOT in ingredient
    let portionWords = stopword.removeStopwords(
      portion.foodDescription.toLowerCase().split(/\s+/)
    );
    for (let word of portionWords) {
      if (ing.text.indexOf(word) == -1) {
        score -= 5;
      }
      if (word == "raw") {
        console.log("RAW!!!!");
        score += 50;
      }
    }
  }

  if (ing.amount?.unit) {
    if (
      getStandardUnit(ing.amount.unit) == getStandardUnit(portion.amount.unit)
    ) {
      score += 100;
    }
  }

  return score;
}
