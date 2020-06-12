/* See https://github.com/babycourageous/netlify-identity-demo-svelte/blob/master/src/store.js */
import { writable, get } from 'svelte/store'
import api from '../data/remoteApi.js';
import netlifyIdentity from 'netlify-identity-widget'

const mock = {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1ODg3MDE5NDcsInN1YiI6ImIxMzBjM2Q2LTM5NjctNGMyZi05YTA1LTViOWI2MDNlZmMzMCIsImVtYWlsIjoidG1oaW5rbGVAZ21haWwuY29tIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIn0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdoczRmektnUl9mWUlfUjRJdndPb21KTjRvZjdCVlNzdzI1cWRNeGh3cyIsImZ1bGxfbmFtZSI6IlRob21hcyBNaWxscyBIaW5rbGUifX0.PDEmiGRmC7qNQ_8M4VMFhTHkrQJk4m0X1-vA4XLW7EU",
    email: "tmhinkle+test@gmail.com",
    expires_at: 1588701947000,
    refresh_token: "EMBJSopyMWhj4pzy9XUBfw",
    token_type: "bearer",
    username: "Joe Schmoe",
}
function createUser() {
    const localUser = JSON.parse(localStorage.getItem('gotrue.user'))

    let u = null
    if (localUser) {
        u = {
            username: localUser.user_metadata.full_name,
            email: localUser.email,
            access_token: localUser.token.access_token,
            expires_at: localUser.token.expires_at,
            refresh_token: localUser.token.refresh_token,
            token_type: localUser.token.token_type,
            id:localUser.id,
        }
    }
    const userStore = writable(u)
    const { subscribe, set, update } = userStore;
    
    getDBUser();
    
    function updateDBUser (dbuser) {
            userStore.update(
                ($user)=>{
                    $user.dbuser = dbuser;
                    return $user;
                }
            )
    }

    async function getDBUser () {
        let $user = get(userStore);
        if ($user) {
            let dbuser = await api.doFetch('getUser',$user);
            updateDBUser(dbuser);
        } else {
            console.log('No user to fetch...');
        }
    }

    
    return {
        subscribe,
        fake (u) {
            set(u);
            api.doFetch('setFakeUser',get(userStore),u).then(
                ()=>{
                    console.log('Told Remote to Faked user: ',user)
                    getDBUser();
                }
            ).catch(
                (err)=>{
                    console.log('Error fetching user',err)
                }
            );
        },
        async removeLinkedAccount () {
            let result = await api.doFetch(
                'removeLinkedAccount',
                get(userStore),
                {}
            );
            updateDBUser(result);
            return
            
        },
        async acceptLinkedAccount (account) {
            let result = await api.doFetch(
                'acceptLinkedAccount',
                get(userStore),
                {account}
            );
            updateDBUser(result);
            return
        },
        async setInvites (accounts) {
            let result = await api.doFetch(
                'setLinkedAccounts',
                get(userStore),
                {accounts}
            );
            updateDBUser(result);
            return
        },
        async addInvite (account) {
            let result = await api.doFetch(
                'addLinkedAccounts',
                get(userStore),
                {accounts:[account]}
            );
            updateDBUser(result);
            return
        },

        async setName (newName) {
            let dbuser = await api.doFetch('changeName',get(userStore),{name:newName})
            updateDBUser(dbuser)            
        },
        getDBUser,
        login(user) {
            const currentUser = {
                username: user.user_metadata.full_name,
                email: user.email,
                access_token: user.token.access_token,
                expires_at: user.token.expires_at,
                refresh_token: user.token.refresh_token,
                token_type: user.token.token_type,
            }
            set(currentUser)
            api.doFetch('getUser',currentUser).then(
                (result)=>{
                    currentUser.dbuser = result
                    set(currentUser);
                    if (netlifyIdentity.gotrue) {
                        netlifyIdentity.gotrue.currentUser().update({
                            data: {
                                dbuser : currentUser.dbuser
                            }
                        }).then(user => console.log('netlify user updated',user))
                    }
                    else {
                        console.log('Fake user? Not finding a netlify identity instance');
                        console.log('User is',currentUser);
                    }
                }
            ).catch((err)=>{
                console.log('ERROR FETCHING USER FROM API',err)
                console.log(err)
            });
        },
        logout() {
            set(null)
        },
    }
}

function createRedirectURL() {
    const { subscribe, set } = writable('')
    return {
        subscribe,
        setRedirectURL(url) {
            set(url)
        },
        clearRedirectURL() {
            set('')
        },
    }
}

export const user = createUser()
export const redirectURL = createRedirectURL()
