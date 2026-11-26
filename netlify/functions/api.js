// The API function. Netlify bundles this file; the code lives in src/data/functions.
import { handler as recipeHandler } from "../../src/data/functions/api.js";
import { shoppingPath, shoppingRouter } from "../lib/shoppingRouter.js";

// All existing routes delegate unchanged; shopping commands are additive.
export function handler(event, context) {
  const path = shoppingPath(event);
  return path === null ? recipeHandler(event, context) : shoppingRouter(event, context, path);
}
