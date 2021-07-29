/********
// validate.js has convenience functions for parsing recipes in
// preparation for inserting them into DBs and for indexing. The indexing
// needs of front-end and back-end are different, so validate also does
// some pruning of the JSON to only keep the stuff we care about.
**************/
// Validate and prepare our recipe for insertion...
// This may do DB-specific things to the recipe to make life easier...
import stopword from "stopword";
import pluralize from "pluralize";
import type { Portion } from "../../types/nutrientTypes";
const salt = new Date().getTime().toString(36);

function quickHash(s) {
  var hash = 0;
  for (var i = 0; i < s.length; i++) {
    var character = s.charCodeAt(i);
    hash = (hash << 5) - hash + character;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function makeId(id, user) {
  let userSalt = quickHash(JSON.stringify(user)).toString(36);
  return `${id}-${salt}-${userSalt}`;
}
let count = 1;

function validateRec(rec) {
  rec.flatIngredients = [];
  if (!rec.ingredients) {
    rec.ingredients = [];
  }
  if (!rec.images) {
    rec.images = [];
  }
  rec.ingredients.map((i) => crawlIngredient(i, rec.flatIngredients));
  rec.fullText = getFullText(rec);
  // Convert booleans to integers
  if (!rec.deleted) {
    rec.deleted = 0;
  } else {
    rec.deleted = 1;
  }
  if (rec.share) {
    rec.share = 1;
  } else {
    rec.share = 0;
  }
}

function getFullText(rec) {
  let texts = [];
  texts.push(rec.title || "");
  rec.text && rec.text.forEach((text) => texts.push(removeMarkup(text.body)));
  rec.flatIngredients.forEach((ing) => texts.push(ing.text || ""));
  rec.sources && rec.sources.forEach((source) => texts.push(source.name || ""));
  rec.categories && rec.categories.forEach((cat) => texts.push(cat.name));
  return texts.join(" ");
}

function removeMarkup(txt) {
  return txt.replace(/(<([^>]+)>)/gi, "");
}

function crawlIngredient(ingredient, array) {
  if (ingredient.ingredients) {
    ingredient.ingredients.map((i) => crawlIngredient(i, array));
  } else {
    array.push(ingredient);
  }
}

/**
For preparing a recipe collection that's been exported for import...
**/
export function prepRecRemote(r, user, isImport = false) {
  /**
          WTF: For reasons I don't understand, MongoDB fetch/retrieve
          was simply failing to fetch back a new recipe when passed
          through the API. To fix it, I had to provide an _id from the
          outset, and then all was well.
          
          So now prepRec always puts an ID on a recipe that doesn't
          have one. We bypass MongoDB's own unique ID system, which is
          maybe not so good -- and makeId above creates a unique ID
          based on the time of update, the user name, and a local ID.

          My hope is that the *same* user is NOT simultaneously creating
          two recipes without localids at the same time (since all new recipes
          should pass through a local db and get a local ID first anyway, this
          shouldn't be a problem, but of course it could change in the future).
        **/

  validateRec(r);
  r.owner = {
    email: user.email,
    full_name: user.metadata && user.metadata.full_name,
  };
  if (isImport) {
    r.localid = r._id;
    delete r._id;
    delete r.id;
  }
  //r.user = user.email
  if (!r._id) {
    if (r.localid) {
      r._id = makeId(r.localid, user);
    } else {
      r._id = makeId(count, user);
      count += 1;
    }
  }
  crawlIngsForIds(r.ingredients);
  validateRec(r);

  function crawlIngsForIds(ii) {
    ii.forEach((i) => {
      if (i.reference && !i.referenceExists) {
        i.reference = makeId(i.reference, user);
      }
    });
  }
}

export function prepRecsRemote(recs, user, isImport = false) {
  recs.recipes.forEach((r) => prepRecRemote(r, user, isImport));
}

export function getWordsFromIng(i) {
  let words = [];
  if (i.text) {
    words.push(i.text.toLowerCase());
    if (i.text.split().length > 1) {
      words = [...words, ...i.text.split()];
    }
  }
  if (i.ingkey) {
    words.push(i.ingkey.toLowerCase());
  }
  words = stopword.removeStopwords(words);
  return words;
}

export function prepRecLocal(rec) {
  validateRec(rec); // step 1...
  rec.words = rec.fullText.split(/\s+/).map((w) => w.toLowerCase());
  delete rec.fullText; // we don't need to keep this.
  rec.words = stopword.removeStopwords(rec.words);
  rec.ings = [];
  rec.flatIngredients.forEach((i) => {
    rec.ings = [...rec.ings, ...getWordsFromIng(i)];
  });
  delete rec.flatIngredients; // not keeping this either
  if (rec.categories) {
    rec.categoryNames = rec.categories.map((c) => c.name);
  }
  if (rec.sources) {
    rec.sourceNames = rec.sources.map((s) => s.name);
  }
  return rec;
}

export function prepPortionLocal(portion: Portion): Portion {
  portion.ingredientWords = [portion.foodDescription.toLowerCase()];
  if (pluralize.isPlural(portion.foodDescription)) {
    portion.ingredientWords.push(pluralize.singular(portion.foodDescription));
  }
  let words = portion.foodDescription.split(/[,:;.]*\s+/);
  if (words.length > 1) {
    for (let word of words) {
      word = word.toLowerCase();
      portion.ingredientWords.push(word);
      if (pluralize.isPlural(word)) {
        portion.ingredientWords.push(pluralize.singular(word));
      }
    }
  }
  return portion;
}

export function getReferencedIDs(recipe) {
  let allTheIngredients = [];
  recipe.ingredients &&
    recipe.ingredients.map((i) => crawlIngredient(i, allTheIngredients));
  return allTheIngredients.filter((i) => i.reference).map((i) => i.reference);
}

export function isLocalID(id) {
  if (isNaN(Number(id))) {
    // mongo IDs are strings
    return false;
  } else {
    // IndexedDB IDs are Numbers
    return true;
  }
}

export { validateRec };
