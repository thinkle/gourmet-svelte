// Guess a shopping aisle for an item, so the list is grouped before anyone
// has sorted anything. Plain keyword matching, no network, no model.
//
// Two tables: CURATED (below, checked first, wins ties) and the desktop app's
// own default ingredient table (aisleDefaults.js). An entry matches when all
// its words are in the item's words; the entry with the most words wins.
// Guesses are computed, never stored: only the user's own choices are.
import { DESKTOP_AISLES } from "./aisleDefaults.js";

/** The aisles offered by default, in a sensible walking order. */
export const DEFAULT_AISLES = ["Produce", "Meat & fish", "Dairy & eggs", "Bakery", "Baking", "Spices", "Pantry", "Frozen", "Drinks"];

const CURATED = {
  "Produce": "onion garlic lemon lime orange apple lettuce spinach kale carrot celery potato tomato cilantro parsley basil mint thyme rosemary scallion ginger banana berry cucumber zucchini squash mushroom herb cabbage broccoli cauliflower shallot leek fennel beet radish grape peach pear avocado jalapeno chive dill sage|bell pepper|lemon juice|lime juice|lemon zest|lemon rind|lemon peel|orange zest|green onion|sweet potato",
  "Dairy & eggs": "milk butter cheese yogurt yoghurt cream egg buttermilk parmesan mozzarella cheddar ricotta feta mascarpone|sour cream|half and half|cream cheese|heavy cream|whipping cream",
  "Meat & fish": "chicken beef pork bacon sausage turkey ham lamb steak shrimp salmon fish cod prosciutto chorizo|ground beef|ground turkey|ground pork",
  "Bakery": "bread tortilla bagel bun pita naan baguette croissant roll",
  "Baking": "flour sugar yeast chocolate cocoa vanilla molasses cornstarch shortening sprinkle marshmallow extract pecan walnut almond toffee butterscotch soda|baking soda|baking powder|corn syrup|cream of tartar|chocolate chip|graham cracker|vanilla extract|confectioner sugar|powdered sugar|brown sugar",
  "Spices": "salt pepper cinnamon nutmeg cumin paprika oregano cayenne turmeric clove cardamom coriander|bay leaf|chili powder|red pepper flake|black pepper|garlic powder|onion powder",
  "Pantry": "bean lentil chickpea broth stock pasta spaghetti penne rice noodle oil vinegar ketchup mustard mayonnaise jam oat cereal salsa couscous quinoa honey|canned tomato|tomato paste|tomato sauce|soy sauce|fish sauce|coconut milk|peanut butter|cooking spray|nonstick spray|olive oil|maple syrup",
  "Frozen": "frozen|ice cream",
  "Drinks": "wine beer brandy rum vodka whiskey juice coffee tea|club soda",
};

const norm = (w) => {
  w = w.toLowerCase();
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("oes")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
};
const words = (s) => String(s).toLowerCase().split(/[^a-zÀ-ſ]+/).filter((w) => w.length > 1).map(norm);

const entries = [];
const add = (aisle, phrase, curated) => {
  const w = [...new Set(words(phrase))];
  if (w.length) entries.push({ aisle, w, curated });
};
for (const [aisle, spec] of Object.entries(CURATED)) {
  const [singles, ...phrases] = spec.split("|");
  for (const s of singles.split(" ")) add(aisle, s, true);
  for (const p of phrases) add(aisle, p, true);
}
for (const [aisle, keys] of Object.entries(DESKTOP_AISLES)) for (const k of keys.split("|")) add(aisle, k, false);

/** The guessed aisle for an item name, or null when nothing matches. */
export function guessAisle(name) {
  const have = new Set(words(name));
  let best = null;
  for (const e of entries) {
    if (!e.w.every((w) => have.has(w))) continue;
    if (!best || e.w.length > best.w.length || (e.w.length === best.w.length && e.curated && !best.curated)) best = e;
  }
  return best ? best.aisle : null;
}
