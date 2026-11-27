// Which colours a recipe wears.
//
// Gourmet reads them off the recipe itself (src/common/colors.js, kept): the
// title first, then the categories, then a few distinctive ingredients. The
// 71 palettes it chooses from are designed pairs, measured for contrast when
// the recipe surface was built (card R2-8), and the app's tints and
// highlights are derived from them.
//
// A recipe may also name one, in its `palette` field, when the automatic
// guess misses -- a Christmas cake that never says "Christmas", a bare
// "Supper" that deserves better than the house brown. The choice is from
// that same designed set, never a free colour: an arbitrary pair would have
// to carry the derived tones with it, and a wall of recipe cards is only
// calm because every palette in it was drawn by the same hand.
//
// The names are the palettes' own words. A palette matches on words, so its
// first word names it ("chocolate", "pumpkin", "japanese"); a handful read
// badly that way and are renamed below.
import { wordColors, getColor } from "../common/colors.js";

/** A palette's name from the words it matches: /chocolate|brownie/ -> "chocolate". */
function slug(matcher) {
  const first = String(matcher).replace(/^\//, "").replace(/\/[a-z]*$/, "").split("|")[0];
  return first
    .replace(/\(\?[:=!]?/g, "")
    .replace(/\\b/g, "")
    .replace(/s\?$/, "")
    .replace(/[()?]/g, "")
    .replace(/\\/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// Where the first word is a prefix, a duplicate or plain odd to read.
const RENAMED = {
  blueberr: "berry",
  strawberr: "cherry",
  chile: "harissa", // "chili" is already the chili-con-carne palette
  chard: "greens",
  basil: "herbs",
  sea: "ocean",
  crab: "shellfish",
  cookie: "bread",
  potato: "root",
  bean: "beans",
  egg: "eggs",
  mexic: "mexican",
  lebanes: "levant",
  swed: "nordic",
  india: "indian",
  china: "chinese",
  japan: "japanese",
  korea: "korean",
  vietnam: "vietnamese",
  cuban: "latin",
  pilaf: "grains",
  pasta: "italian",
};

/** The palette a recipe wears when nothing matches: cream on brown. */
export const HOUSE = "house";
const houseColor = getColor(null);

export const paletteName = (matcher) => {
  const name = slug(matcher);
  return RENAMED[name] ?? name;
};

/** Every palette a recipe can be given, in the order the matcher tries them. */
export const palettes = [
  ...wordColors.map((w) => ({ name: paletteName(w.matcher), color: w.color })),
  { name: HOUSE, color: houseColor },
];

const byName = new Map(palettes.map((p) => [p.name, p.color]));
const nameOf = new Map(wordColors.map((w) => [w.color, paletteName(w.matcher)]));

export const paletteNames = palettes.map((p) => p.name);
export const isPalette = (name) => typeof name === "string" && byName.has(name);

/** The palette this recipe would get from its own words, by name. */
export function automaticName(recipe) {
  return nameOf.get(getColor(recipe)) ?? HOUSE;
}

/**
   The colours to show a recipe in: the one it names, else the one its words
   choose. A name we do not know (an older app, a typo) falls back to the
   automatic choice rather than showing nothing.
*/
export function paletteFor(recipe) {
  const chosen = recipe?.palette;
  return (typeof chosen === "string" && byName.get(chosen)) || getColor(recipe);
}

/** For API clients choosing one: name and colours, without the matchers. */
export const paletteList = () =>
  palettes.map(({ name, color }) => ({
    name,
    bg: color.bg,
    fg: color.fg,
    accent: color.accent ?? color.fg,
  }));
