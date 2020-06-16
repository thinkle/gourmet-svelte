export const fakeUser = {
    name:'Fake Local User',
    email:'tmhinkle@gmail.com',
}

export function getFakeUser () {
    console.log('getFakeUser => ',fakeUser);
    return fakeUser;
}

export function setFakeUser (event, context, user, params) {
    fakeUser.name = params.name
    fakeUser.email = params.email
    delete fakeUser.dbUser;
    console.log('Set fake user =>',fakeUser)
    return true;
}
