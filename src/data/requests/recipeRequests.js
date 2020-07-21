import {Request} from './remoteRequest.js';
import {each,optional} from '../../utils/validator.js';
import RecDef from '../../common/RecDef.js';

let validRec = {
    title:optional(''),
    ingredients:optional([]),
    images:optional([]),
    categories:optional([]),
    yields:optional([]),
    sources:optional([]),
    times:optional([]),
    text:optional([]),
}

export const mostRecentRequest = Request(
    {name:'lastSync',
     responseDef:2, // number - i.e. timestamp
     chatty:true,
    }
);

export const addRecipeRequest = Request(
    {name:'addRecipe',
     responseDef:{_id:'',...validRec},
     requestDef:{recipe:validRec},
     chatty:true,
    }
);

export const updateRecipeRequest = Request(
    {name:'updateRecipe',
     responseDef:{...validRec,_id:'',last_remote_save:new Date()},
     requestDef:{recipe:{_id:'',...validRec}},
     chatty:true}
);
     
export const getRecipeRequest = Request(
    {name:'getRecipe',
     requestDef:{_id:''},
     responseDef:validRec,
     chatty:false
    }
);

export const getRecipesRequest = Request(
    {name:'getRecipes',
     requestDef:{page:optional(1),
                 query:optional({}),
                 fields:optional([]),
                 limit:optional(1)
                },
     responseDef:{
         count:optional(1),
         result:each(validRec),
         page:optional(1)
     }
    }
);

export const deleteRecipeRequest = Request(
    {name:'deleteRecipe',
     requestDef:{_id:''},
     responseDef:1
    }
);

export const importRecipesRequest = Request(
    {name:'importRecipes',
     requestDef:{
         recipes : [],
     },
     responseDef:[]}
);
