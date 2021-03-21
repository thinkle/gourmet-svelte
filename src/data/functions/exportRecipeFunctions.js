import { exportRecipesRequest } from "../requests/index.js";
import {queryCollection} from './mongoConnect'

exportRecipesRequest.setRequestHandler(exportRecipes);

async function exportRecipes(
  user, 
  params /*: {
    ids: [],
    page? : any,
    sort? : any,
    limit: number,
  } */ /* failed TS experiment... maybe come back later... :\ */
  ) {
  let ids = params.ids;
  console.log('ids=',ids)
  let result = await queryCollection(
    'recipes',
    { // query
      $and : [
        {_id : {$in: ids}},
        {$or : [
          {'owner.email' : user.account},
          {'shared':1},
        ]}
      ]
    },
    {limit:100,
     page:params.page,
     sort:params.sort
    }
  )
  return result;
}
