import {Request} from './remoteRequest.js';

export const mostRecentRequest = Request(
    {name:'lastSync',
     responseDef:2, // number - i.e. timestamp
     chatty:true,
    }
);

export const addRecipeRequest = Request(
    {name:'addRecipe',
     responseDef:{_id:''},
     requestDef:{recipe:{}},
     chatty:true,
    }
);
