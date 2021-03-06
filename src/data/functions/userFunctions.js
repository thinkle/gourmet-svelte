import {insertOne,insertMany,queryCollection,getOne,updateOne,replaceOne} from './mongoConnect.js';
import {
    getUserRequest,
    acceptLinkedAccountRequest,
    setLinkedAccountsRequest,
    addLinkedAccountsRequest,
    setNameRequest,
    markUserNotNewRequest,
    removeLinkedAccountRequest,
} from '../requests/index.js';
export const userCache = {
    
}

const cache =  (f) => async (user,params)=>{
    let result = await f(user, params);
    userCache[user.email] = result;
    return {
        ...userCache[user.email],
        ...result
    };
}

export async function add (user) {
    return insertOne('users',user)
}

export async function getUser (user) {
    //console.log('getUser!',user);
    if (!user || !user.email) {
        //console.log('No email, return empty user');
        return {}
    } else {
        const query = {
            email : user.email
        }
        let result = await getOne('users',query)
        let invites = await checkForLinkInvites(user.email);
        if (invites && invites.count) {
            invites = invites.result
        } else {
            invites = undefined;
        }
        if (result) {
            //console.log('Got result, use as dbUser',result)
            if (invites) {result.invites = invites;}
            userCache[user.email] = result;
            user.dbUser = result;
            //console.log('Found user: ',user);
            return user;
        }
        else {
            console.log('No user exists, adding one...')
            query.newUser = true;
            result = await add(query);
            if (invites) {result.invites = invites;}
            userCache[user.email] = result;
            user.dbUser = result;
            return user;
        }
    }
}

getUserRequest.setRequestHandler(getUser);

async function checkForLinkInvites (email) {
    return queryCollection('users',{linkedAccounts:email})
}


removeLinkedAccountRequest.setRequestHandler(cache(
    async function (user, params) {
        console.log('removeLinkedAccount for ',user,params);
        let dbUser = user.dbUser;
        dbUser.linked = undefined;
        replaceOne('users',{_id:dbUser._id},dbUser);
        return user
    })
);

acceptLinkedAccountRequest.setRequestHandler(
    cache(
        async function (user,params) {
            console.log('acceptLinkedAccount for ',user,params);
            let dbUser = user.dbUser;
            let otherAccount = await getOne('users',{email:params.account})
            if (otherAccount && otherAccount.linkedAccounts && otherAccount.linkedAccounts.includes(user.email)) {
                dbUser.linked = params.account
                replaceOne('users',{email:user.email,_id:dbUser._id},dbUser)
            } else {
                throw new Error(
                    `No invite for user ${user.user} to account ${params.account}`
                );
            }
            return user
        }
    )
)

addLinkedAccountsRequest.setRequestHandler(
    cache(async function (user,params) {
        let linkedAccounts = params.accounts;
        let dbUser = user.dbUser;
        if (dbUser.linkedAccounts) {
            if (!Array.isArray(dbUser.linkedAccounts)) {
                console.log('bad linkedAccounts stored: not an array',dbUser.linkedAccounts);
                dbUser.linkedAccounts = []
            }
            dbUser.linkedAccounts = [...new Set([...dbUser.linkedAccounts,...linkedAccounts])]
        } else {
            dbUser.linkedAccounts = [...linkedAccounts];
        }
        await update({email:dbUser.email,_id:dbUser._id},dbUser);
        return user;
}));

setLinkedAccountsRequest.setRequestHandler(
    cache(
    async function (user,params) {
        let linkedAccounts = params.accounts;
        let dbUser = user.dbUser;
        dbUser.linkedAccounts = params.accounts
        await update({_id:dbUser._id},dbUser);
        return user;
    }
));

markUserNotNewRequest.setRequestHandler(
    cache(async function (user, params) {
        console.log('markUserNotNew Upated!')
        //let result = await updateOne('users',{_id:user.dbUser._id},{$set:{newUser:false}});
        user.dbUser.newUser = false;
        let result = await replaceOne('users',{_id:user.dbUser._id},user.dbUser);
        console.log('markUserNotNew Upated!',result)
        return user
    })
);
                                
setNameRequest.setRequestHandler(
    cache(async function (user, params) {
        //let result = await updateOne('users',{_id:user.dbUser._id},{$set:{name:params.name}});
        user.dbUser.name = params.name;
        user.name = params.name
        let result = await replaceOne('users',{_id:user.dbUser._id},user.dbUser);
        return user;
    })
);

async function update (query, user) {
    console.log('Update',query,user);
    return replaceOne('users',query,user)
}

