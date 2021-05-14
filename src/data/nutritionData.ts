import type { NutrientQueryResult } from "../types/nutrientTypes";
import type { Amount, Ingredient } from "../types/ingredientTypes";
import { get } from "svelte/store";
import { user } from "../stores/userStore";
import {
  queryNutrientRequest,
  getNutrientInfoRequest,
} from "./requests/nutritionRequests";
import dexieApi from "./local/dexieApi";
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

export async function queryLocalNutrients(
  queryString: string,
  queryType: QueryTypes = QueryTypes.GENERAL
): Promise<NutrientQueryResult> {
  let results = await dexieApi.queryNutrientRelations(queryString);
  console.log("Got results:", results);
  return {
    foods: results.map((r) => ({
      ...r.nutrient,
      matchInfo : r.match        
    })
  }
}
