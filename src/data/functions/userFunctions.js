import {insertOne,insertMany,queryCollection,getOne,updateOne,replaceOne} from './mongoConnect.js';

export const userCache = {
}

const cache =  (f) => async (event,context,user,params)=>{
    let result = await f(event, context, user, params);
    userCache[user.email] = result;
    return {
        ...userCache[user.email],
        ...result
    };
}

export async function add (user) {
    return insertOne('users',user)
}

export const getUser = cache(async function getUser (event,context,user) {
    if (!user.email) {
        return {}
    }
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
        if (invites) {result.invites = invites;}
        userCache[user.email] = result;
        user.dbUser = result;
        return result;
    }
    else {
        console.log('No user exists, adding one...')
        query.newUser = true;
        result = await add(query);
        if (invites) {result.invites = invites;}
        userCache[user.email] = result;
        user.dbUser = result;
        return result;
    }
})

async function checkForLinkInvites (email) {
    return queryCollection('users',{linkedAccounts:email})
}


export const removeLinkedAccount = cache(async function (event, context, user, params) {
    console.log('removeLinkedAccount for ',user,params);
    let dbUser = user.dbUser;
    dbUser.linked = undefined;
    replaceOne('users',{_id:dbUser._id},dbUser);
    return dbUser
});


export const acceptLinkedAccount = cache(async function (event, context, user, params) {
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
    return dbUser
});

export const addLinkedAccounts = cache(async function (event,context,user,params) {
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
    return update({email:dbUser.email,_id:dbUser._id},dbUser);
});

export const setLinkedAccounts = cache(
    async function (event,context,user,params) {
        let linkedAccounts = params.accounts;
        let dbUser = user.dbUser;
        dbUser.linkedAccounts = params.accounts
        return update({_id:dbUser._id},dbUser);
    }
);

export const markUserNotNew = cache(async function (event, context, user, params) {
    let result = updateOne('users',{_id:user.dbUser._id},{$set:{newUser:false}});
    return result
});
                                
export const changeName = cache(async function (event, context, user, params) {
    let result = updateOne('users',{_id:user.dbUser._id},{$set:{name:params.name}});
    return result;
});

async function update (query, user) {
    console.log('Update',query,user);
    return replaceOne('users',query,user)
}

