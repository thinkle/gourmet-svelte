// Presentation only: custom aisle names keep their text label and default colors.
const kinds = {
  Produce: "produce", Meat: "meat", "Seafood Counter": "seafood", "Dairy & eggs": "dairy",
  Bakery: "bakery", Baking: "baking", Spices: "spices", Deli: "deli", Canned: "canned",
  "Rice, Pasta and Grains": "grains", "International Aisle": "international", "Oils & Condiments": "condiments",
  Frozen: "frozen", "Coffee & Tea": "coffee", "Cereal & Breakfast": "breakfast",
  "Soda & Water": "soda", Juice: "juice", "Beer, Wine & Spirits": "alcohol",
};

export const aisleKind = (name) => Object.hasOwn(kinds, name) ? kinds[name] : null;

// Display aliases only: explicit assignments keep their stored keys.
export const aisleName = (name) => name === "Pantry" ? "Misc (choose an aisle)"
  : name === "Dairy & eggs" ? "Dairy & Eggs" : name ?? "Other";
