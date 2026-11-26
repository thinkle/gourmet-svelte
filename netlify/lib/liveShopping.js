import { randomBytes } from 'crypto';
import { loadDB } from '../../src/data/functions/mongoConnect.js';

const fail = (status, message) => Object.assign(new Error(message), { status });
const identifier = (s) => typeof s === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(s);
const tripId = () => randomBytes(16).toString('hex');

/** Shopping-only atomic operations; deliberately independent of recipe replacement/merge. */
export async function liveShopping(account, input) {
  if (!input || typeof input.listId !== 'string' || !input.listId || input.listId.length > 200) {
    throw fail(400, 'A saved shopping list is required.');
  }
  const { db } = await loadDB();
  const recipes = db.collection('recipes');
  const where = { _id: input.listId, 'owner.email': account, isShoppingList: 1, deleted: { $nin: [1, true] } };
  let rec = await recipes.findOne(where);
  if (!rec) throw fail(404, 'Shopping list not found in this account.');
  const action = input.action;
  if (action && (!identifier(action.clientId) || !Number.isSafeInteger(action.seq) || action.seq < 1
    || !identifier(action.tripId) || !['cart', 'done'].includes(action.type)
    || (action.type === 'cart' && (typeof action.key !== 'string' || !action.key.trim()
      || action.key.length > 500 || typeof action.on !== 'boolean')))) {
    throw fail(400, 'Invalid live shopping action.');
  }
  // Only an explicit join initializes the trip. Two joiners cannot replace each other's token.
  if (!rec.liveShopping?.tripId) {
    if (action) throw fail(409, 'Join live shopping before sending changes.');
    await recipes.updateOne({ ...where, 'liveShopping.tripId': { $exists: false } }, {
      $set: { liveShopping: { tripId: tripId(), seen: {}, revision: 0 } },
    });
    rec = await recipes.findOne(where);
    if (!rec) throw fail(404, 'Shopping list not found in this account.');
  }
  let staleTrip = false;
  if (action) {
    const seen = `liveShopping.seen.${action.clientId}`;
    const filter = { ...where, 'liveShopping.tripId': action.tripId,
      $or: [{ [seen]: { $exists: false } }, { [seen]: { $lt: action.seq } }] };
    const update = action.type === 'done'
      ? { $set: { cart: [], trip: [], 'liveShopping.tripId': tripId(), 'liveShopping.seen': {}, last_modified: Date.now() } }
      : { [action.on ? '$addToSet' : '$pull']: { cart: action.key },
          $set: { [seen]: action.seq, last_modified: Date.now() } };
    update.$currentDate = { last_remote_save: true };
    update.$inc = { 'liveShopping.revision': 1 };
    const result = await recipes.findOneAndUpdate(filter, update, { returnOriginal: false });
    rec = result.value || await recipes.findOne(where);
    if (!rec) throw fail(404, 'Shopping list not found in this account.');
    staleTrip = !result.value && rec.liveShopping.tripId !== action.tripId;
  }
  // Images are irrelevant to shopping and can make polling responses very large.
  const { images, ...recipe } = rec;
  return { recipe, staleTrip };
}
