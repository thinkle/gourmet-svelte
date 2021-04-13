import type {
  Nutrient,
  UsdaFoodNutrient,
  UsdaAbbreviatedFoodNutrient,
} from "../../types/nutrientTypes";

console.log("Loaded nutrientUtils.ts");

export function getNutrientById(
  nutrient: Nutrient,
  id: number
): UsdaFoodNutrient {
  let item: UsdaFoodNutrient = nutrient.foodNutrients.find(
    (n: UsdaFoodNutrient | UsdaAbbreviatedFoodNutrient) => {
      if (n.nutrient) {
        if (n.nutrient.id === id) {
          return true;
        }
      } else {
        if (n.nutrientId === id) {
          return true;
        }
      }
    }
  );
  if (item && item.nutrient) {
    return item;
  } else if (item) {
    return {
      nutrient: {
        id: item.nutrientId,
        number: item.nutrientNumber,
        name: item.nutrientName,
        unitName: item.unitName,
        rank: 999,
      },
      type: "Abbreviated",
      amount: item.value,
    };
  }
  return {
    nutrient: {
      id,
      number: "unknown",
      name: "unknown",
      rank: 999,
      unitName: "",
    },
    type: "missing",
    amount: 0,
  };
}
/* 
    }
  );
} */
