import type { Amount } from "./ingredientTypes";

export interface NutrientQueryResult {
  foods: Nutrient[];
  foodSearchCriteria?: {
    pageNumber: number;
  };
}

export interface NutrientLookup {
  [key: number]: Nutrient;
}

interface MeasureUnit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface UsdaPortion {
  id: number;
  dataPoints: number;
  gramWeight: number;
  sequenceNumber: number;
  modifier: string;
  measureUnit: MeasureUnit;
  fdcId: number;
  foodDescription: string;
  foodClass: string;
  storedLocally: boolean;
  amount?: number;
}

export interface PortionAmount extends Amount {
  portion?: Portion;
  portionDescription?: string;
  density?: number;
  ml?: number;
  unitModifier?: string;
}

export interface Portion {
  id: number;
  dataPoints: number;
  gramWeight: number;
  sequenceNumber: number;
  amount: PortionAmount;
  modifier: string;
  measureUnit: {
    id: number;
    name: string;
    abbreviation: string;
  };
  fdcId: number;
  foodDescription: string;
  foodClass: string;
  foodCode: string;
  storedLocally: true;
  ingredientWords?: string[];
}

export interface UsdaAbbreviatedFoodNutrient {
  nutrientId: number;
  nutrientName: string;
  nutrientNumber: string;
  unitName: string;
  value: number;
}

export interface UsdaFoodNutrient {
  nutrient: {
    id: number;
    number: string;
    name: string;
    rank: number;
    unitName: string;
  };
  type: string;
  amount?: number;
  brandOwner?: string;
}

export interface UsdaFoodAttribute {
  id: number;
  value: string;
  sequenceNumber: number;
  foodAttributeType: {
    id: number;
    name: string;
    description: string;
  };
}

export interface UsdaFood {
  id: number;
  foodDescription: string;
  ingredientDescription: string;
  ingredientWeight: number;
  portionCode: string;
  portionDescription: string;
  sequenceNumber: number;
  ingredientCode: number;
  unit: string;
  amount: number;
}

export interface Nutrient {
  detailed: true;
  brandOwner?: string;
  wweiaFoodCategory: {
    wweiaFoodCategoryCode: number;
    wweiaFoodCategoryDescription: string;
  };
  description: string;
  foodAttributes: UsdaFoodAttribute[];
  foodCode: string;
  inputFoods: UsdaFood[];
  startDate: string;
  endDate: string;
  foodComponents: [];
  foodClass: string;
  fdcId: number;
  publicationDate: string;
  foodNutrients: UsdaFoodNutrient[] | UsdaAbbreviatedFoodNutrient[];
  foodPortions?: UsdaPortion[];
  dataType: string;
  densities: Portion[];
  portions: Portion[];
  density: number;
  storedLocally: boolean;
  indexWords?: string[];
  commonNames?: string;
  additionalDescriptions?: string;
}
