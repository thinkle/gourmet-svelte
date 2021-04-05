interface QueryNutrientParams {
  query: string;
  sortBy?: string[];
}

export const queryNutrientRequest = {
  makeRequest({ 
    user, 
    params: QueryNutrientParams 
  }): Promise<any>,
  handleRequest({ 
    user, 
    params: QueryNutrientParams 
  }): Promise<any>;
}

interface GetNutrientInfoRequestParams {
  id : string
}
export const getNutrientInfoRequest = {
  makeRequest({
    user,
    params : GetNutrientInfoRequestParams
  }) : Promise<any>,
  handleRequest({
    user,
    params : GetNutrientInfoRequestParams,
  }) : Promise<any>
}