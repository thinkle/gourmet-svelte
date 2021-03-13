import deepcopy from 'deepcopy';
import { updateOne } from './mongoConnect.js';
import { prepRecRemote } from '../utils/validate.js';

export async function updateRecipe(user, params) {
    let { recipe, forceMerge } = params;
    recipe = deepcopy(recipe);
    let lastSave = recipe.last_remote_save;
    if (lastSave) { delete recipe.last_remote_save; }
    prepRecRemote(recipe, user);
    // let result = await replaceOne('recipes',
    //                               {_id:recipe._id,
    //                                'owner.email':user.account},
    //                               recipe);
    let result = await updateOne(
        'recipes',
        { _id: recipe._id, 'owner.email': user.account },
        [{
            $replaceWith: //recipe
            {
                $cond: {
                    // If we are updating the last saved document...
                    if: {
                        $and: [
                            // we are last saved...
                            {
                                $eq: [
                                    { $toString: lastSave }, { $toString: "$$CURRENT.last_remote_save" }
                                ]
                            },
                            { $not: forceMerge },
                        ]
                    },
                    //]}
                    // then just copy it
                    then: { ...recipe, merged: false },
                    // Otherwise we try to "merge" - ugh
                    else: {
                        // Otherwise the requester had a stale document, so let's merge...
                        $mergeObjects: [
                            "$$CURRENT",
                            {
                                ...recipe,
                                ingTexts: {
                                    $map: {
                                        input: recipe.ingredients,
                                        "in": "$$this.text"
                                    }
                                },
                                merged: true,

                                // now we merge all the array fields
                                categories: {
                                    $setUnion: [
                                        "$$CURRENT.categories",
                                        { $cond: [recipe.categories, recipe.categories, []] }
                                    ]
                                },
                                sources: {
                                    $setUnion: [
                                        "$$CURRENT.sources",
                                        { $cond: [recipe.sources, recipe.sources, []] }
                                    ]
                                },
                                images: {
                                    $setUnion: [
                                        "$$CURRENT.images",
                                        { $cond: [recipe.images, recipe.images, []] }
                                    ]
                                },
                                // And to preserve the order of ingredients is a PITA...
                                ingredients: {
                                    $map: {
                                        input: makeIngredientsExpression({
                                            newIngs: recipe.ingredients,
                                            oldIngs: "$$CURRENT.ingredients"
                                        }),
                                        "in": {
                                            $cond: {
                                                if: "$$this.ingredients",
                                                then: {
                                                    $mergeObjects: [
                                                        "$$this",
                                                        {
                                                            ingredients: makeIngredientsExpression(
                                                                {
                                                                    newIngs: "$$this.ingredients",
                                                                    oldIngs: makeFindMatchingIngListExpression("$$this.text", "$$CURRENT.ingredients")
                                                                }
                                                            )
                                                        }
                                                    ]
                                                },
                                                else: "$$this"
                                            }
                                        }
                                    }
                                },
                            },
                            {
                                previousServerSaveTime: "$$CURRENT.last_remote_save",
                                previousLocalServerSaveTime: lastSave,
                            },
                        ] // end merge recipes
                    } // end else
                }
            } // end conditional
        },
        {
            $set: { last_remote_save: "$$NOW" }
        },
        ]);
    return result;
}


export function makeFindMatchingIngListExpression (targetText, list) {
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
export function makeIngredientsExpression ({newIngs, oldIngs}) {
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

