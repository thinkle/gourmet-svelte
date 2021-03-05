import {Request} from './remoteRequest.js';

export const AdminSetupRequest = Request(
    {
        name:'setup',
        requestDef:{
            action : '',            
        },
        responseDef:{},
    }
)

export const EchoRequest = Request(
    {name:'echo'}
)

export const ThrowErrorRequest = Request(
    {name:'throwError'}
)