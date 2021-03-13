import { getOne, updateOne } from './mongoConnect.js';
import { getReferencedIDs } from '../utils/validate.js';
import {
    getSharedRecipeRequest,
    setRecipeSharingRequest
} from '../requests/index.js';


export async function getSharedRecipe(user, { _id }) {
    // FIX ME: We should check that the recipe is actually shared by adding a parameter to getOne, but this will
    // let us test easier for now... FIXME FIXME FIXME
    let recipe = await getOne('recipes', { _id, share: true });
    if (recipe) {
        return recipe;
    } else {
        throw Error(`No recipe found @ id ${_id}`);
    }
}
getSharedRecipeRequest.setRequestHandler(getSharedRecipe);
setRecipeSharingRequest.setRequestHandler(
    async function setSharing(user, { _id, share }, alreadyDone = []) {
        let result;
        if (alreadyDone.indexOf(_id) == -1) {
            result = await updateOne('recipes', { _id }, { $set: { share : share && 1 || 0 } });
            // get embedded recipes and set those...
            if (share) {
                // let's be recursive...
                let references = getReferencedIDs(result);
                alreadyDone.push(_id);
                console.log('Also update', references);
                for (let r of references) {
                    console.log('Updating...', r);
                    await setSharing(user, { _id: r, share : share && 1 || 0 }, alreadyDone);
                }
            }
        }
        return result;

    }
);
