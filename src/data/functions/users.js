import {insertOne,insertMany,queryCollection,getOne,updateOne} from './mongoConnect.js';

export async function add (user) {
    return insertOne('users',user)
}

export async function getUser (event,context,user) {
    const query = {
        name : user.name,
        email : user.email
    }
    let result = await getOne('users',query)
    if (result) {
        return result;
    }
    else {
        console.log('No user exists, adding one...')
        result = await add(query);
        return result;
    }
}

export async function update (query, user) {
    return updateOne('users',query,user)
}
