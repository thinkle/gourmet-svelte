import { writable, get } from "svelte/store";
import { user } from "./userStore";
import {
  queryNutrientRequest,
  getNutrientInfoRequest,
} from "../data/requests/";
import { parseAmount } from "../utils/numbers";
import { parseUnit, getML } from '../utils/unitAmounts';
import { getGramWeight } from "../utils/unitAmounts";

let fetching = false;

function waitMyTurn() {
  return new Promise((resolve, reject) => {
    if (fetching) {
      console.log("waiting...");
      setTimeout(() => waitMyTurn().then(resolve).catch(reject), 1000);
    } else {
      resolve();
    }
  });
}
/* We are going to assume...

Information per nutrient can change when we fetch new info
Associations can change.

We have a store for nutrient info and we have a store
for for looking up info...

*/

export let nutrientMatches = writable({});

nutrientMatches.search = async (searchTerms) => {
  console.log("Store is searching!");
  let $matches = get(nutrientMatches);
  if ($matches[searchTerms]) {
    return $matches[searchTerms];
  } else {
    await waitMyTurn();
    fetching = true;
    let $user = get(user);
    let queryResponse;
    try {
      queryResponse = await queryNutrientRequest.makeRequest({
        user: $user,
        params: { query: searchTerms },
      });
    } catch (err) {
      fetching = false;
      throw err;
    }
    fetching = false;
    let page = 1;
    let result = {
      page: 1,
      ...queryResponse,
    };
    if (queryResponse.foods) {
      nutrients.update(($nutrients) => {
        for (let food of queryResponse.foods) {
          $nutrients[food.fdcId] = food;
        }
        console.log("Updated nutrients store: ", $nutrients);
        return $nutrients;
      });
    }
    nutrientMatches.update(($matches) => {
      $matches[searchTerms] = result;
      return $matches;
    });
    return result;
  }
};

export let nutrients = writable({}); /* Eventually will be in local storage */

export let portions = writable([]);

nutrients.fetchDetails = async function ({ fdcId }) {
  let currentNutrient = get(nutrients)[fdcId];
  if (currentNutrient.detailed) {
    return currentNutrient;
  } else {
    await waitMyTurn();
    fetching = true;
    let response;
    let $user = get(user);
    try {
      response = await getNutrientInfoRequest.makeRequest({
        user: $user,
        params: { id: `${fdcId}` },
      });
    } catch (err) {
      fetching = false;
      throw err;
    }
    fetching = false;
    if (response) {
      console.log("Got details for ", fdcId, response);
      if (response?.result) {   
        let densities = [];    
        if (response?.result?.foodPortions) {
          portions.update(($portions) => {
            $portions = [
              ...$portions,
              ...response.result.foodPortions.map((p) => {
                p = {
                    ...p,
                  fdcId,
                  foodDescription: response.result.description,
                  foodClass: response.result.foodClass,
                  foodCode: response.result.foodCode,
                  amount : getAmountFromPortion(p)
                };
                if (p.amount?.density) {
                  densities.push(p);
                }
                return p;
              }),
            ];
            return $portions;
          });          
        }
        nutrients.update(($nutrients) => {
          $nutrients[fdcId] = { detailed: true, ...response.result };
          if (densities.length) {
            $nutrients[fdcId].densities = densities;
            $nutrients[fdcId].density = densities[0].amount.density;
          }
          return $nutrients;
        });
      }
      fetching = false;
      return true;
    }
    return false;
  }
};

export function getNutrient(fdcid) {
  let value = nutrients[fdcid];
  let nutrient = writable(nutrients[fdcid]);
}


export function getAmountFromPortion (portion) {
  let amount = {gramWeight:portion.gramWeight}
  amount.amount = portion.amount
  amount.portion = portion;
  amount.portionDescription = portion.portionDescription
  if (portion.amount && !portion?.measureUnit?.id==9999) {
    if (portion.measureUnit) {
      amount.measureUnit = portion.measureUnit;
      amount.unit = portion.measureUnit.abbreviation || portion.measureUnit.name    
    }
  } else if (portion.portionDescription) {
      amount = {...amount, ...parseUnit(portion.portionDescription)}
      if (!amount.unit) {

      }
      if (!amount.amount) {
        amount = {...amount,...parseAmount(portion.portionDescription)}
      } 
  } else {
    amount = {...amount, ...parseUnit(portion.modifier)}
  }
  let ml = getML(amount);
  if (ml) {
    amount.ml = ml;
    amount.density = amount.gramWeight / amount.ml
  }
  if (!amount.unit && amount.text) {
    amount.unit = amount.text;
  }
  amount.unitModifier = amount.posttext && amount.posttext.replace(/^\s+|\s+$/g,'') || amount.modifier;
  return amount;
}
