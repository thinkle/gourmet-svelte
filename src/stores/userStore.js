/* See https://github.com/babycourageous/netlify-identity-demo-svelte/blob/master/src/store.js */
import { writable, get } from 'svelte/store'
import api from '../data/remoteApi.js';
import netlifyIdentity from 'netlify-identity-widget'

import {
    getUserRequest
} from '../data/requests/';

const mock = {
    access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1ODg3MDE5NDcsInN1YiI6ImIxMzBjM2Q2LTM5NjctNGMyZi05YTA1LTViOWI2MDNlZmMzMCIsImVtYWlsIjoidG1oaW5rbGVAZ21haWwuY29tIiwiYXBwX21ldGFkYXRhIjp7InByb3ZpZGVyIjoiZ29vZ2xlIn0sInVzZXJfbWV0YWRhdGEiOnsiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hLS9BT2gxNEdoczRmektnUl9mWUlfUjRJdndPb21KTjRvZjdCVlNzdzI1cWRNeGh3cyIsImZ1bGxfbmFtZSI6IlRob21hcyBNaWxscyBIaW5rbGUifX0.PDEmiGRmC7qNQ_8M4VMFhTHkrQJk4m0X1-vA4XLW7EU",
    email: "tmhinkle+test@gmail.com",
    expires_at: 1588701947000,
    refresh_token: "EMBJSopyMWhj4pzy9XUBfw",
    token_type: "bearer",
    username: "Joe Schmoe",
}


// Ok -- this is a little complicated...
// We have:
// 1. Local user info, including access_token, username, email
// 2. Remote user info, showing the token worked, including a bit more detail
// 3. DB info, showing that we have stored user information, etc.
//
// We will store them like...
//
// user = {
//   ...localUser,
//   remoteUser : {
//       dbUser : ...
//       ...
//    }
// }

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
    if (netlifyIdentity.gotrue && netlifyIdentity.gotrue.currentUser()) {
        // refresh?
        netlifyIdentity.gotrue.currentUser().jwt()
    }

    if (u) {
        getRemoteUser();
    } 
    
    function updateDBUser (dbUser) {
            userStore.update(
                ($user)=>{
                    if (!$user.remoteUser) {
                        console.log('WARNING: getting DB user but no remote user?',user);
                        $user.remoteUser = {}
                    }
                    $user.remoteUser.dbUser = dbUser;
                    return $user;
                }
            )
    }

    async function getRemoteUser () {
        let $user = get(userStore);
        if ($user) {
            let remoteInfo = await api.doFetch('echo',$user);
            let remoteUser = remoteInfo.user;
            userStore.update(
                ($user)=>{
                    $user.remoteUser = remoteUser
                    return $user;
                }
            );
            return remoteUser;
        } else {
            console.log('getRemoteUser: No user to fetch...');
            throw Error('No user to fetch');
        }
    }

    
    return {
        subscribe,
        fake (u) {
            set(u);
            api.doFetch('setFakeUser',get(userStore),u).then(
                ()=>{
                    console.log('Told Remote to Faked user: ',u)
                    getRemoteUser();
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
        async markNotNew (newName) {
            await api.doFetch('markUserNotNew',get(userStore),{})
            await getRemoteUser()
        },
        getRemoteUser,
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
            api.doFetch('echo',currentUser).then(
                (result)=>{
                    currentUser.remoteUser = result.user
                    set(currentUser);
                    if (netlifyIdentity.gotrue) {
                        netlifyIdentity.gotrue.currentUser().update({
                            username : currentUser.name ,
                            data: {
                                dbuser : result.user && result.user.remoteUser && result.user.remoteUser.dbUser,
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
