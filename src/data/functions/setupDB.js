//import {fquery,q} from './faunaUtil.js';
//import {runQuery,runImport} from './gql.js';
import {
  loadDB,
  runTest,
  insertOne,
  insertMany,
  queryCollection,
} from "./mongoConnect";
import recs from "../recs.json";
import { validateRec, prepRecsRemote } from "../utils/validate";
import { AdminSetupRequest } from "../requests/index";

const functions = {
  mongoConnect: runTest,
  setupIndexes: async function () {
    let results = [];
    results.push(await functions.create_recipe_index());
    results.push(await functions.create_user_index());
    return results;
  },
  has_access: async (user, params) => {
    if (user.email == "tmhinkle@gmail.com") {
      return { access: true };
    } else {
      return {
        access: false,
      };
    }
  },
  create_user_index: async () => {
    const { client, db } = await loadDB();
    const c = db.collection("users");
    await c.createIndex({ name: 1 });
    await c.createIndex({ linkedAccounts: 1 });
    return await c.createIndex({ email: 1 }, { unique: true });
  },
  query_recipes: async () => {
    return queryCollection("recipes", { fullText: /oven/i }, {});
  },
  create_users: async (user, params) => {
    let { client, db } = await loadDB();
    let result = await db.collection("users").drop();
  },

  create_recipes: async (user, params) => {
    if (params.user) {
      user = params.user; // set up for user
    }
    //fquery(q.Collection('users'))
    let { client, db } = await loadDB();
    try {
      let result = await db.collection("recipes").drop();
    } catch (err) {
      console.log("unable to drop recipes - maybe does not exist yet?");
    }
    prepRecsRemote(recs, user);
    let recipes = await insertMany("recipes", recs.recipes);
    return recipes;
  },
  create_recipe_index: async () => {
    const { client, db } = await loadDB();
    const c = db.collection("recipes");
    const results = [];
    for (let [index, options] of [
      [{ title: 1 }, {}],
      [{ "owner.email": 1 }],
      [{ "fullText.item": "text" }, { name: "fulltext" }],
      [{ "categories.name": 1 }, { name: "category" }],
      [{ "flatIngredients.item": 1 }, { name: "ingredients" }],
      [{ deleted: 1 }, {}],
      [{ last_modified: 1 }, {}],
    ]) {
      try {
        results.push(await c.createIndex(index, options));
      } catch (err) {
        console.log(err);
        console.log("Message:", err.errmsg);
        results.push(err);
      }
    }
    return results;
  },
};

AdminSetupRequest.setRequestHandler(async function (user, params) {
  if (user && user.email == "tmhinkle@gmail.com") {
    return functions[params.action](user, params);
  } else {
    return {
      message: "No way sir, no how no go: user not permitted!!,",
      status: "ERROR",
      user: user || "no user logged in",
    };
  }
});

let actions = Object.keys(functions);
export { actions };
