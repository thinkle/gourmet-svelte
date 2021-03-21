import {Request} from './remoteRequest.js';
import {empty} from '../../utils/validator'

let user = {
    email : '',
    dbUser : {},
}

export const getUserRequest = Request(
    {name:'getUser',
     requestDef:undefined,
     responseDef:user, // number - i.e. timestamp
     chatty:true,
    }
);

export const setFakeUserRequest = Request(
    {name:'setFakeUser',
     requestDef:{},
     responseDef:{},
    }
)

export const getFakeUserRequest = Request(
    {
        name:'getFakeUser',
        requestDef:{},
        responseDef:user,
    }
)

export const removeLinkedAccountRequest = Request(
    {name:'removeLinkedAccount',
     requestDef:empty,
     responseDef:user
    }
)

export const acceptLinkedAccountRequest = Request(
    {
      name:'acceptLinkedAccount',
      requestDef : {}, // account
      responseDef : user,
    }
)

export const setLinkedAccountsRequest = Request ({
    name:'setLinkedAccounts',
    requestDef: {account:[]},
    responseDef : user,
})

export const addLinkedAccountsRequest = Request({
    name:'addLinkedAccounts',
    requestDef:{accounts:[]},
    responseDef:user,
})

export const setNameRequest = Request({
    name : 'changeName',
    requestDef : {name:''},
    responseDef : user,
})

export const markUserNotNewRequest = Request({
    name : 'markUserNotNew',
    requestDef:empty,
    responseDef:user,
})