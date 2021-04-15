import {
  getNutrientInfoRequest,
  queryNutrientRequest,
} from "../requests/index.js";
import querystring from "querystring";
import fetch from "node-fetch";

const API_KEY = process.env.USDA_KEY;

queryNutrientRequest.setRequestHandler(async (u, params) => {
  let q = { ...params, api_key: API_KEY };
  let qs = querystring.encode(q);
  let response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods/search?${qs}`
  );
  let result = await response.json();
  return result;
});

getNutrientInfoRequest.setRequestHandler(async (u, params) => {
  let qs = querystring.encode({ api_key: API_KEY });
  let response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/foods?fdcIds=${params.id}&${qs}`
  );
  let result = await response.json();
  return {
    id: params.id,
    result: result[0],
    key: API_KEY,
  };
});
