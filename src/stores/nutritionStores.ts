import {
  Nutrient,
  NutrientLookup,
  NutrientQueryResult,
  UsdaPortion,
  Portion,
  PortionAmount,
} from "../types/nutrientTypes";
import { Amount } from "../types/ingredientTypes";
import { writable, get, derived, Writable } from "svelte/store";
import { user } from "./userStore";
import {
  queryNutrientRequest,
  getNutrientInfoRequest,
} from "../data/requests/index";
import { parseAmount } from "../utils/numbers";
import { parseUnit, getML } from "../utils/unitAmounts";
import { getGramWeight } from "../utils/unitAmounts";
import dexieApi from "../data/local/dexieApi";

let fetching = false;

if (!dexieApi.db) {
  dexieApi.connect();
}

function waitMyTurn() {
  return new Promise((resolve, reject) => {
    if (fetching) {
      console.log("waiting...");
      setTimeout(() => waitMyTurn().then(resolve).catch(reject), 1000);
    } else {
      resolve(true);
    }
  });
}
/* We are going to assume...

Information per nutrient can change when we fetch new info
Associations can change.

We have a store for nutrient info and we have a store
for for looking up info...

*/

interface NutrientMatchesStore
  extends Writable<{
    [key: string]: NutrientQueryResult;
  }> {
  cachedSearch(searchTerms: string): Promise<NutrientQueryResult>;
  usdaSearch(searchTerms: string, page?: number): Promise<NutrientQueryResult>;
  search(searchTerms: string): Promise<NutrientQueryResult>;
  fetchMore(searchTerms: string): Promise<NutrientQueryResult>;
}

export let nutrientMatches: NutrientMatchesStore = writable({});

nutrientMatches.cachedSearch = async (searchTerms) => {
  let result = await dexieApi.db.nutrientSearches.get({ search: searchTerms });
  if (result) {
    console.log("Got result, now fetch foods...", result);
    console.log("Result of type", typeof result, JSON.stringify(result));
    let foods = await dexieApi.db.nutrients.bulkGet(
      result.foods.map((o) => o.fdcId)
    );
    result.foods = foods;
    console.log("Added foods", result.foods);
  }
  return result;
};

nutrientMatches.usdaSearch = async (searchTerms, page = 1) => {
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
  let result = {
    page: page,
    ...queryResponse,
  };
  console.log("Store nutrientSearches in dexie");
  dexieApi.db.nutrientSearches.put({
    search: searchTerms,
    page,
    foodSearchCriteria: queryResponse.foodSearchCriteria,
    foods: queryResponse.foods.map((f) => ({ fdcId: f.fdcId })),
  });
  return result;
};

nutrientMatches.search = async (searchTerms) => {
  console.log("Store is searching!");
  let $matches = get(nutrientMatches);
  // check store...
  if ($matches[searchTerms]) {
    return $matches[searchTerms];
  } else {
    let queryResponse = await nutrientMatches.cachedSearch(searchTerms);
    console.log("Cached result: ", queryResponse);
    if (!queryResponse) {
      queryResponse = await nutrientMatches.usdaSearch(searchTerms);
    }
    nutrientMatches.storeResult(queryResponse);
    return queryResponse;
  }
};
interface NutrientMatchesStore {
  storeResult(queryResponse: NutrientQueryResult): void;
}
nutrientMatches.storeResult = function (queryResponse) {
  let searchTerms = queryResponse.foodSearchCriteria.query;
  if (queryResponse.foods) {
    nutrients.update(($nutrients) => {
      for (let food of queryResponse.foods) {
        if ($nutrients[food.fdcId]) {
          $nutrients[food.fdcId] = {
            ...$nutrients[food.fdcId],
            ...food,
          };
        } else {
          $nutrients[food.fdcId] = food;
        }
      }
      console.log("Updated nutrients store: ", $nutrients);
      return $nutrients;
    });
  }
  nutrientMatches.update(($matches) => {
    $matches[searchTerms] = queryResponse;
    return $matches;
  });
};

nutrientMatches.fetchMore = async function (searchTerms) {
  let currentResults = get(nutrientMatches)[searchTerms];
  // Handle accidental "more" when there is no more...
  if (!currentResults) {
    await nutrientMatches.search(searchTerms);
    return;
  } else {
    let page = currentResults.foodSearchCriteria.pageNumber + 1;
    console.log("Fetch page ", page, currentResults, searchTerms);
    let $user = get(user);
    let queryResponse = await queryNutrientRequest.makeRequest({
      user: $user,
      params: {
        query: searchTerms,
        page: page,
        pageNumber: page,
      },
    });
    queryResponse.foods = [...currentResults.foods, ...queryResponse.foods];
    nutrientMatches.storeResult(queryResponse);
    return queryResponse;
  }
};

export let portionsById = writable<{
  [key: number]: Portion;
}>({});
export let portions = derived([portionsById], ([$portionsById]): Portion[] => {
  return Object.values($portionsById);
});

interface NutrientsStore
  extends Writable<{
    [key: number]: Nutrient;
  }> {
  fetchFromUsda({ fdcId: number }): Promise<any>;
  fetchCached({ fdcId: number }): Promise<any>;
  fetchDetails({ fdcId: number }): Promise<any>;
}

export let nutrients: NutrientsStore = writable(
  {}
); /* Eventually will be in local storage */

nutrients.fetchFromUsda = async function ({ fdcId }) {
  console.log("Fetch from USDA");
  await waitMyTurn();
  console.log("Done waiting, let us fetch!");
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
    console.log("Pity, an error", err);
    throw err;
  }
  console.log("Success", response);
  fetching = false;
  if (response) {
    return response.result;
  }
};

nutrients.fetchCached = async function ({ fdcId }) {
  console.log("Check for cached nutrient", fdcId);
  let result = await dexieApi.db.nutrients.get({ fdcId });
  console.log("Got cached: ", result);
  return result;
};

nutrients.fetchDetails = async function ({ fdcId }) {
  console.log("Fetch details!");
  if (!fdcId) {
    return;
  }
  let currentNutrient = get(nutrients)[fdcId];
  if (currentNutrient?.detailed) {
    return currentNutrient;
  } else if (!currentNutrient) {
    currentNutrient = await nutrients.fetchCached({ fdcId });
  }
  if (!currentNutrient?.detailed) {
    currentNutrient = await nutrients.fetchFromUsda({ fdcId });
    currentNutrient.storedLocally = false;
  }
  if (currentNutrient) {
    nutrients.update(($nutrients) => {
      $nutrients[fdcId] = { detailed: true, ...currentNutrient };
      return $nutrients;
    });
  }
};

export function getNutrient(fdcid: number) {
  let value = nutrients[fdcid];
  let nutrient = writable(nutrients[fdcid]);
}

export function getAmountFromPortion(portion: UsdaPortion): PortionAmount {
  let amount: PortionAmount = { gramWeight: portion.gramWeight };
  amount.amount = portion.amount;
  amount.portion = portion;
  amount.portionDescription = portion.portionDescription;
  if (portion.amount && !portion?.measureUnit?.id == 9999) {
    if (portion.measureUnit) {
      amount.measureUnit = portion.measureUnit;
      amount.unit =
        portion.measureUnit.abbreviation || portion.measureUnit.name;
    }
  } else if (portion.portionDescription) {
    amount = { ...amount, ...parseUnit(portion.portionDescription) };
    if (!amount.unit) {
    }
    if (!amount.amount) {
      amount = { ...amount, ...parseAmount(portion.portionDescription) };
    }
  } else {
    amount = { ...amount, ...parseUnit(portion.modifier) };
  }
  let ml = getML(amount);
  if (ml) {
    amount.ml = ml;
    amount.density = amount.gramWeight / amount.ml;
  }
  if (!amount.unit && amount.text) {
    amount.unit = amount.text;
  }
  amount.unitModifier =
    (amount.posttext && amount.posttext.replace(/^\s+|\s+$/g, "")) ||
    amount.modifier;
  if (amount.unitModifier == amount.unit) {
    delete amount.unitModifier;
  }
  return amount;
}

// Update local database when fetching...
portionsById.subscribe(($portions) => {
  console.log("update $portions", $portions);
  Object.values($portions).forEach((p) => {
    if (!p.storedLocally) {
      console.log("add portion!", p);
      dexieApi.addPortion(p);
    }
  });
});

nutrients.subscribe(($nutrients) => {
  Object.values($nutrients).forEach((n) => {
    // Check for nutrients and such...
    let densities = [];
    if (n.foodPortions) {
      console.log("Update portions!");
      portionsById.update(($portionsById) => {
        n.foodPortions.forEach((p) => {
          if (!$portionsById[p.id]) {
            p = {
              ...p,
              fdcId: n.fdcId,
              foodDescription: n.description,
              foodClass: n.foodClass,
              foodCode: n.foodCode,
              amount: getAmountFromPortion(p),
            };
            $portionsById[p.id] = p;
            if (p.amount?.density) {
              densities.push(p);
            }
            return p;
          }
        });
        return $portionsById;
      }); // end portionsById.update
    }
    if (densities.length) {
      $nutrients[n.fdcId].densities = densities;
      $nutrients[n.fdcId].density = densities[0].amount.density;
    }

    // Store in dexie if not yet stored...
    if (!n.storedLocally) {
      console.log("store nutrient!", n);
      dexieApi.addNutrient(n);
    }
  });
  return $nutrients;
});
