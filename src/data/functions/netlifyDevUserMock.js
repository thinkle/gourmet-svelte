export const fakeUser = {
    name:'Fake Local User',
    email:'tmhinkle@gmail.com',
}
export function setFakeUser (event, context, user, params) {
    fakeUser.name = params.name
    fakeUser.email = params.email
    return true;
}
