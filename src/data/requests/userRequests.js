import {Request} from './remoteRequest.js';

export const getUserRequest = Request(
    {name:'getUser',
     requestDef:undefined,
     responseDef:{
         email:'',
         dbUser : {
         }
     }, // number - i.e. timestamp
     chatty:true,
    }
);


