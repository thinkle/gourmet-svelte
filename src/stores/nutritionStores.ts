import stopword from "stopword";
import type {
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
  localSearch(searchTerms: string): Promise<NutrientQueryResult>;
  usdaSearch(searchTerms: string, page?: number): Promise<NutrientQueryResult>;
  search(searchTerms: string): Promise<NutrientQueryResult>;
  fetchMore(searchTerms: string): Promise<NutrientQueryResult>;
}

export let nutrientMatches: NutrientMatchesStore = writable({});

nutrientMatches.localSearch = async (searchTerms) => {
  // nevermind for now
  return;
  let result = await dexieApi.db.nutrientSearches.get({ search: searchTerms });
  if (result) {
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
      params: {
        query: searchTerms,
        //dataType: ["SR Legacy", "Survey(FNDDS)"]
      },
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
  //console.log("Store nutrientSearches in dexie");
  /* dexieApi.db.nutrientSearches.put({
    search: searchTerms,
    page,
    foodSearchCriteria: queryResponse.foodSearchCriteria,
    foods: queryResponse.foods.map((f) => ({ fdcId: f.fdcId })),
  }); */
  return result;
};

nutrientMatches.search = async (searchTerms, branded = false) => {
  let $matches = get(nutrientMatches);
  // check store...
  if ($matches[searchTerms]) {
    return $matches[searchTerms];
  } else {
    let queryResponse = await nutrientMatches.localSearch(searchTerms, branded);
    if (!queryResponse) {
      queryResponse = await nutrientMatches.usdaSearch(searchTerms, branded);
      nutrientMatches.storeResult(queryResponse, branded);
    }
    return queryResponse;
  }
};
interface NutrientMatchesStore {
  storeResult(queryResponse: NutrientQueryResult): void;
}
nutrientMatches.storeResult = function (queryResponse, branded) {
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
    console.log("Pity, an error", err);
    throw err;
  }
  fetching = false;
  if (response) {
    return response.result;
  }
};

nutrients.fetchCached = async function ({ fdcId }) {
  let result = await dexieApi.db.nutrients.get({ fdcId });
  let portions = await dexieApi.db.portions
    .where("fdcId")
    .equals(fdcId)
    .toArray();
  if (portions.length) {
    result.portions = portions;
    result.detailed = true;
  }
  nutrients.update(($nutrients) => {
    $nutrients[fdcId] = result;
    return $nutrients;
  });
  return result;
};

nutrients.fetchDetails = async function ({ fdcId }) {
  if (!fdcId) {
    return;
  }
  let currentNutrient = get(nutrients)[fdcId];
  if (currentNutrient?.detailed) {
    return currentNutrient;
  } else {
    currentNutrient = await nutrients.fetchCached({ fdcId });
  }
  if (!currentNutrient?.detailed) {
    currentNutrient = await nutrients.fetchFromUsda({ fdcId });
    // Store it?
    dexieApi.db.nutrients.put(currentNutrient, currentNutrient.fdcId);
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
  Object.values($portions).forEach((p) => {
    if (!p.storedLocally) {
      dexieApi.addPortion(p);
    }
  });
});

nutrients.subscribe(async ($nutrients) => {
  for (let n of Object.values($nutrients)) {
    if (typeof n == "number") {
      console.log("WTF NUTRIENT IS A NUMBER", n);
    }
    // Check for nutrients and such...
    let densities = [];
    let portions = [];
    if (n.foodPortions) {
      portionsById.update(($portionsById) => {
        portions = n.foodPortions.map((p) => {
          if (!$portionsById[p.id]) {
            let portion: Portion = {
              ...p,
              fdcId: n.fdcId,
              foodDescription: n.description,
              foodClass: n.foodClass,
              foodCode: n.foodCode,
              amount: getAmountFromPortion(p),
            };
            $portionsById[p.id] = portion;
            if (portion.amount?.density) {
              densities.push(portion);
            }
            return portion;
          }
        });
        return $portionsById;
      }); // end portionsById.update
    }
    if (densities.length) {
      $nutrients[n.fdcId].densities = densities;
      $nutrients[n.fdcId].density = densities[0].amount.density;
    }
  }
});

function indexNutrient(n: Nutrient) {
  n.indexWords = [];
  addWordAndWords(n.description);
  addWordAndWords(n.commonNames);
  addWordAndWords(n.additionalDescriptions);

  function addWordAndWords(w: string): void {
    if (w) {
      let hasSpaces = w.search(/\s+/);
      if (hasSpaces > -1) {
        n.indexWords = [...n.indexWords, w, ...w.split(/\s+/)];
      } else {
        n.indexWords.push(w);
      }
    }
  }
  n.indexWords = n.indexWords.map((w) => w.replace(/[,.;:+]/g, ""));
  n.indexWords = stopword.removeStopwords(n.indexWords);
}
