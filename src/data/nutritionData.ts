import type { NutrientQueryResult } from "../types/nutrientTypes";
import type { Amount, Ingredient } from "../types/ingredientTypes";
import { get } from "svelte/store";
import { user } from "../stores/userStore";
import {
  queryNutrientRequest,
  getNutrientInfoRequest,
} from "./requests/nutritionRequests";

export enum QueryTypes {
  GENERAL,
  BRANDED,
}

export async function queryUSDANutrients(
  queryString: string,
  page: number = 1,
  queryType: QueryTypes = QueryTypes.GENERAL
): Promise<NutrientQueryResult> {
  let dataType;
  if (queryType == QueryTypes.GENERAL) {
    dataType = ["SR Legacy", "Survey(FNDDS)"];
  } else if (queryType == QueryTypes.BRANDED) {
    dataType = ["Branded"];
  }
  const $user = get(user);
  let queryResponse = await queryNutrientRequest.makeRequest({
    user: $user,
    params: {
      query: queryString,
      dataType,
      pageNumber: page,
    },
  });

  return queryResponse;
}

export function queryMongoNutrients(
  queryString: string,
  queryType: QueryTypes = QueryTypes.GENERAL
): NutrientQueryResult {
  return {
    foods: [],
  };
}

export function queryLocalNutrients(
  queryString: string,
  queryType: QueryTypes = QueryTypes.GENERAL
): NutrientQueryResult {
  return {
    foods: [],
  };
}
