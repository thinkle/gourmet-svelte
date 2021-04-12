import { getGramWeight, getML } from "../../utils/unitAmounts";

export async function inferNutrientForIngredient(i) {
  return null;
}

export async function inferGramWeightForIngredient(i) {
  if (i.gramWeight) {
    return null;
  } else {
    let inferred = getGramWeight(i.amount);
    if (inferred != i.inferred_gramWeight) {
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
  throw new Error("Function not implemented.");
}
