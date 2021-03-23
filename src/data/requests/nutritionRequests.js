import {Request} from './remoteRequest.js';
import {each,optional} from '../../utils/validator.js';

export const queryNutrientRequest = Request(
    {name:'queryNutrients',
     requestDef:{query:'query',sortBy:optional([""]),dataType:optional([""])},
     responseDef:
         {}
     , // number - i.e. timestamp
     chatty:true,
    }
);

export const getNutrientInfoRequest = Request(
    {
        name : 'getNutrient',
        requestDef:{id:'id'},
        responseDef:{
        },
        chatty:true,
    }
)


