// Guess a shopping aisle for an item, so the list is grouped before anyone
// has sorted anything. Plain keyword matching, no network, no model.
//
// Two tables: CURATED (below, checked first, wins ties) and the desktop app's
// own default ingredient table (aisleDefaults.js). An entry matches when all
// its words are in the item's words; the entry with the most words wins.
// Guesses are computed, never stored: only the user's own choices are.
import { DESKTOP_AISLES } from "./aisleDefaults.js";

/** The aisles offered by default, in a sensible walking order. */
export const DEFAULT_AISLES = [
  "Produce", "Bakery", "Dairy & eggs", "Meat", "Seafood Counter", "Deli",
  "Canned", "Rice, Pasta and Grains", "International Aisle", "Baking", "Spices",
  "Oils & Condiments", "Cereal & Breakfast", "Coffee & Tea", "Soda & Water",
  "Juice", "Frozen", "Beer, Wine & Spirits",
];

const CURATED = {
  "Produce": "onion garlic lemon lime orange apple lettuce spinach kale carrot celery potato tomato cilantro parsley basil mint thyme rosemary scallion ginger banana berry cucumber zucchini squash mushroom herb cabbage broccoli cauliflower shallot leek fennel beet radish grape peach pear avocado jalapeno chive dill sage|bell pepper|lemon juice|lime juice|lemon zest|lemon rind|lemon peel|orange zest|green onion|sweet potato",
  "Dairy & eggs": "milk butter cheese yogurt yoghurt cream egg buttermilk parmesan mozzarella cheddar ricotta feta mascarpone|sour cream|half and half|cream cheese|heavy cream|whipping cream",
  "Meat": "chicken beef pork bacon sausage turkey lamb steak veal mutton duck goose chorizo|ground beef|ground turkey|ground pork",
  "Seafood Counter": "anchovy bass cod eel flounder haddock halibut lingcod mahi blowfish catfish herring pike pollock sanddab sardine salmon snapper sole sturgeon swordfish tilapia tilefish trout tuna whitefish whiting roe caviar crab lobster shrimp prawn crayfish abalone clam mussel octopus oyster squid scallop fish surimi|sea bass|red snapper|king crab|rock cod",
  "Deli": "prosciutto salami pastrami mortadella bologna ham hummus olives|cold cuts|deli turkey|sliced turkey|smoked turkey|sliced ham|deli cheese",
  "Bakery": "bread tortilla bagel bun pita naan baguette croissant roll",
  "Baking": "flour sugar yeast chocolate cocoa vanilla molasses cornstarch shortening sprinkle marshmallow extract pecan walnut almond toffee butterscotch soda|baking soda|baking powder|corn syrup|cream of tartar|chocolate chip|graham cracker|vanilla extract|confectioner sugar|powdered sugar|brown sugar",
  "Spices": "salt pepper cinnamon nutmeg cumin paprika oregano cayenne turmeric clove cardamom coriander|bay leaf|chili powder|red pepper flake|black pepper|garlic powder|onion powder",
  "Canned": "canned broth stock|canned tomato|tomato paste|tomato sauce|chicken broth|beef stock|vegetable broth|canned tuna",
  "Rice, Pasta and Grains": "lentil chickpea pasta spaghetti linguine linguini fettuccine rigatoni fusilli macaroni penne rice noodle couscous quinoa bulgur barley farro polenta|dried bean|dried chickpea|lasagna noodle",
  "International Aisle": "tahini miso nori gochujang tamarind mirin|soy sauce|fish sauce|coconut milk|curry paste|rice vinegar|sesame oil|shrimp paste|chili paste|chilli paste|flat rice noodle",
  "Oils & Condiments": "oil vinegar ketchup mustard mayonnaise jam salsa honey|peanut butter|cooking spray|nonstick spray|olive oil|maple syrup",
  "Frozen": "frozen|ice cream",
  "Cereal & Breakfast": "cereal oatmeal granola muesli oat pancake waffle|rolled oat|breakfast cereal",
  "Coffee & Tea": "coffee tea espresso matcha|coffee bean|ground coffee|tea bag",
  "Soda & Water": "soda seltzer cola water|club soda|sparkling water|tonic water|soft drink",
  "Juice": "juice nectar|orange juice|apple juice|grape juice|cranberry juice",
  "Beer, Wine & Spirits": "wine beer brandy rum vodka whiskey whisky gin bourbon tequila sherry vermouth liqueur|white wine|red wine",
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
// The desktop's broad Pantry and Meat & fish buckets are reference data.
// Reclassify their guesses into today's defaults without changing stored choices.
const curatedEntries = [...entries];
for (const [aisle, keys] of Object.entries(DESKTOP_AISLES)) {
  for (const k of keys.split("|")) {
    let target = aisle;
    if (aisle === "Pantry" || aisle === "Meat & fish") {
      target = bestMatch(k, curatedEntries)?.aisle ?? (aisle === "Pantry" ? "Oils & Condiments" : "Meat");
    }
    add(target, k, false);
  }
}

/** Prefer specific phrases; curated entries win ties with the desktop table. */
function bestMatch(name, candidates) {
  const have = new Set(words(name));
  let best = null;
  for (const e of candidates) {
    if (!e.w.every((w) => have.has(w))) continue;
    if (!best || e.w.length > best.w.length || (e.w.length === best.w.length && e.curated && !best.curated)) best = e;
  }
  return best;
}

/** The guessed aisle for an item name, or null when nothing matches. */
export function guessAisle(name) {
  const have = new Set(words(name));
  // Packaging tells you which part of the store to visit, even for produce/fish.
  if (have.has("frozen")) return "Frozen";
  if (have.has("canned") || have.has("tinned")) return "Canned";
  return bestMatch(name, entries)?.aisle ?? null;
}
