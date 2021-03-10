import deepcopy from 'deepcopy';
import {require} from '../../utils/requireParams.js';
import {jsonConcisify} from '../../utils/textUtils.js';
import {loadDB,DB,getLastResult,insertOne,insertMany,queryCollection,getOne,replaceOne,deleteOne,updateOne} from './mongoConnect.js';
import {prepRecRemote,getReferencedIDs}  from '../utils/validate.js';
import {addRecipeRequest,
        deleteRecipeRequest,
        mostRecentRequest,
        updateRecipeRequest,
        getRecipeRequest,
        getRecipesRequest,
        getSharedRecipeRequest, 
        setRecipeSharingRequest ,    
        } from '../requests/index.js';

export async function getMostRecent (user) {
    let response = await queryCollection(
        'recipes',
        {'owner.email':user.account}, // query
        {
            fields : ['last_modified'],
            sort:{last_modified:-1},
            limit:1
        } // options
    );
    let result = response.result
    console.log('getMostRecent Got result:',result);
    if (result) {
        return result[0].last_modified
    } else {
        return 0
    }
}
mostRecentRequest.setRequestHandler(getMostRecent);


export async function addRecipe (user, params) {
    let {recipe} = params
    prepRecRemote(recipe,user);
    //console.log('Add recipe',recipe.title,JSON.stringify(recipe.owner))
    let result = await insertOne('recipes',
                                 recipe,recipe);
    return result;
}
addRecipeRequest.setRequestHandler(addRecipe);

export async function updateRecipe (user, params) {
    let {recipe,forceMerge} = params;    
    recipe = deepcopy(recipe);
    let lastSave = recipe.last_remote_save
    if (lastSave) {delete recipe.last_remote_save}
    prepRecRemote(recipe,user);
    // let result = await replaceOne('recipes',
    //                               {_id:recipe._id,
    //                                'owner.email':user.account},
    //                               recipe);
    let result = await updateOne(
        'recipes',
        {_id:recipe._id,'owner.email':user.account},
        [{$replaceWith : //recipe
          {$cond : {
              // If we are updating the last saved document...
              if : {
                  $and : [
                      // we are last saved...
                      {$eq : [
                          {$toString:lastSave}, {$toString:"$$CURRENT.last_remote_save"}
                      ]},
                      {$not : forceMerge},
                  ]
              },
              //]}
              // then just copy it
              then : {...recipe,merged:false},
              // Otherwise we try to "merge" - ugh
              else : {
                  // Otherwise the requester had a stale document, so let's merge...
                  $mergeObjects :
                  [
                      "$$CURRENT", // baseline is "current" for any props we don't have in recipe...
                      { 
                          ...recipe, // then we add recipe
                          ingTexts: {$map:{
                              input:recipe.ingredients,
                              "in":"$$this.text"}
                                    },
                          merged: true, // plus a flag that we've merged
                          // now we merge all the array fields
                          categories:{
                              $setUnion : [
                                  "$$CURRENT.categories",
                                  {$cond:[recipe.categories,recipe.categories,[]]}
                              ]
                          },
                          sources : {
                              $setUnion : [
                                  "$$CURRENT.sources",
                                  {$cond:[recipe.sources,recipe.sources,[]]}
                              ]
                          },
                          images : {
                              $setUnion : [
                                  "$$CURRENT.images",
                                  {$cond:[recipe.images,recipe.images,[]]}
                              ]
                          },
                          // And to preserve the order of ingredients is a PITA...
                          ingredients:{
                              $map : {
                                  input : makeIngredientsExpression({
                                      newIngs:recipe.ingredients,
                                      oldIngs:"$$CURRENT.ingredients"
                                  }),
                                  "in" : {
                                      $cond : {
                                          if : "$$this.ingredients",
                                          then : {$mergeObjects : [
                                              "$$this",
                                              {ingredients : makeIngredientsExpression(
                                                  {newIngs:"$$this.ingredients",
                                                   oldIngs:makeFindMatchingIngListExpression("$$this.text","$$CURRENT.ingredients")}
                                              )}
                                          ]},
                                          else : "$$this"
                                      }
                                  }
                              }
                          },
                          
                      },
                      {
                          previousServerSaveTime:"$$CURRENT.last_remote_save",
                          previousLocalServerSaveTime:lastSave,
                      },
                  ] // end merge recipes
              } // end else
          }} // end conditional
         }, // end $replaceWith
         {
             $set : {last_remote_save:"$$NOW"}
         },
        ]);
    return result;
}
updateRecipeRequest.setRequestHandler(updateRecipe);

export async function getRecipe (user,params) {
        let {_id} = params;
        let recipe = await getOne('recipes',{_id, 'owner.email':user.account})
        if (recipe) {
            return recipe
        }
        else {
            // try grabbing one not for user/???
            //let recipe = await getOne('recipes',{_id})
            //throw Error(`No recipe found for user ${user.account}, _id ${_id}: Found this though: ${recipe} -last result was ${getLastResult()}`);
            throw Error(`No recipe found for user ${user.account}, _id ${_id}. Last DB result was ${getLastResult()}`);
        }
}

getRecipeRequest.setRequestHandler(getRecipe)

export async function getSharedRecipe (user,{_id}) {
    // FIX ME: We should check that the recipe is actually shared by adding a parameter to getOne, but this will
    // let us test easier for now... FIXME FIXME FIXME
    let recipe = await getOne('recipes',{_id,share:true})
    if (recipe) {
        return recipe
    } else {
        throw Error(`No recipe found @ id ${_id}`);
    }
}

getSharedRecipeRequest.setRequestHandler(getSharedRecipe);

setRecipeSharingRequest.setRequestHandler(
    async function setSharing (user,{_id,share},alreadyDone=[]) {
        let result
        if (alreadyDone.indexOf(_id)==-1) {
            result = await updateOne('recipes',{_id},{$set:{share}});
            // get embedded recipes and set those...
            if (share) {
                // let's be recursive...
                let references = getReferencedIDs(result);
                alreadyDone.push(_id)
                console.log('Also update',references)
                for (let r of references) {
                    console.log('Updating...',r)
                     await setSharing(user,{_id:r,share},alreadyDone);
                }
            }
        }
        return result;
        
    }
)


export async function getRecipes (user,params) {
        let {page,query,fields,limit} = params;
        // Enforce user only searches own recipes!
        if (!query) {
            query = {}
        }
        if (query['owner.email']) {
                console.log('Warning: we had another email query???');
                console.log('Quashing it: it was',query);
        }
        query['owner.email'] = user.account;
        if (!limit) {
            limit = 100;
            if (fields && !fields.contains('text') && !fields.contains('ingredients')) {
                limit = 1000;
            }
        }
        if (!query['deleted']) {
            query.deleted =  {$ne: 1} // null or 0 or false
        }
        //console.log('getRecipes got ',page,query,fields,limit)
        let result = await queryCollection(
            'recipes',
            query,
            {fields, limit, page,
            sort:{last_modified:-1},
            }
        );
        return result
}

getRecipesRequest.setRequestHandler(getRecipes)

export async function deleteRecipe (user, params) {
    require(['_id'],params)
    const {_id} = params
    let count = await deleteOne('recipes',{_id:_id,'owner.email':user.account});
    if (count >= 1) {
        return count;
    }
    else {
        throw Error(
            `No recipe found to delete. Request ${jsonConcisify(params)}. Result: ${getLastResult()}`
        )
    }
}
deleteRecipeRequest.setRequestHandler(deleteRecipe);

function makeFindMatchingIngListExpression (targetText, list) {
    return {
        $let : {
            vars : {
                matchingItems : {
                    $filter : {
                        input : list,
                        cond : {
                            $and : [
                                "$$this.ingredients",
                                {$eq : [
                                    "$$this.text",
                                    targetText
                                ]}
                            ]
                        }
                    }
                }
            },
            "in" : {
                $cond : {
                    if : "$$matchingItems",
                    then : {
                        $let : {
                            vars : {
                                ing : {$arrayElemAt : ["$$matchingItems",0]}
                            },
                            "in" : "$$ing.ingredients"
                        }
                    },
                    else : [],
                }
            }
        }
    }
}

// Helper functions to prevent me from losing my mind with too many levels of indentation
function makeIngredientsExpression ({newIngs, oldIngs}) {
    return {
        $cond : {
            if : {
                $and : [
                    newIngs,
                    oldIngs
                ]
            },
            then : {
                $concatArrays : [
                    newIngs,
                    {$filter : {
                        input: oldIngs,
                        cond : {
                            $eq : [
                                -1,
                                {$indexOfArray : [
                                    {$map:{
                                        input:newIngs,
                                        "in":"$$this.text"}
                                    },
                                    "$$this.text"
                                ]}
                            ]
                        }
                    }}
                ]
            },
            else : {
                $or : [newIngs,oldIngs]
            }
        }
    }
}

