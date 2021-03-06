/* See https://github.com/babycourageous/netlify-identity-demo-svelte/blob/master/src/store.js */
import { writable, get } from 'svelte/store'
import api from '../data/remoteRecipeData.js';
import netlifyIdentity from 'netlify-identity-widget'

import {
    getUserRequest,
    setFakeUserRequest,
    removeLinkedAccountRequest,
    addLinkedAccountsRequest,
    setLinkedAccountsRequest,
    setNameRequest,
    markUserNotNewRequest,
    acceptLinkedAccountRequest,

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
    let localUser;
    try {
         localUser = JSON.parse(localStorage.getItem('gotrue.user'))
    } catch (err) {
        console.log('Bad localUser stored :(',localStorage.getItem('gotrue.user'))
        localStorage.setItem('gotrue.localuser','null');
    }

    let u = null
    if (localUser) {
        u = {
            username: localUser?.user_metadata?.full_name,
            email: localUser.email,
            access_token: localUser?.token?.access_token,
            expires_at: localUser?.token?.expires_at,
            refresh_token: localUser?.token?.refresh_token,
            token_type: localUser?.token?.token_type,
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
            //let remoteInfo = await api.doFetch('echo',$user);
            let remoteUser = await getUserRequest.makeRequest({user:$user});
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
        async fake (u) {
            set(u);
            //api.doFetch('setFakeUser',get(userStore),u)
            try {
                await setFakeUserRequest.makeRequest(
                    {user:get(userStore),params:u}
                )
            } catch (err) {
                console.log('Error fetching new user after fake :(',err)
                return;
            }
            await getRemoteUser();
            console.log('Set gotrue...');
            localStorage.setItem('gotrue.user',JSON.stringify(get(userStore)))
            console.log('$user is now',get(userStore))
        },
        async removeLinkedAccount () {
            let result = await removeLinkedAccountRequest.makeRequest(
                {user:get(userStore)}
            )
            /* let result = await api.doFetch(
                'removeLinkedAccount',
                get(userStore),
                {}
            ); */
            updateDBUser(result);
            return
            
        },
        async acceptLinkedAccount (account) {
            /* let result = await api.doFetch(
                'acceptLinkedAccount',
                get(userStore),
                {account}
            ); */
            let result = await acceptLinkedAccountRequest.makeRequest(
                {user:get(userStore),
                params:{account}}
            );
            updateDBUser(result);
            return
        },
        async setInvites (accounts) {
            /* let result = await api.doFetch(
                'setLinkedAccounts',
                get(userStore),
                {accounts}
            ); */
            let result = await setLinkedAccountsRequest.makeRequest(
                {user:get(userStore),
                params:{accounts}}
            )
            updateDBUser(result);
            return
        },
        async addInvite (account) {
            /* let result = await api.doFetch(
                'addLinkedAccounts',
                get(userStore),
                {accounts:[account]}
            ); */
            let result = await addLinkedAccountsRequest.makeRequest(
                {user:get(userStore),
                params:{accounts:[account]}}
            )
            updateDBUser(result);
            return
        },
        async setName (newName) {
            //let dbuser = await api.doFetch('changeName',get(userStore),{name:newName})
            let dbuser = await setNameRequest.makeRequest(
                {
                    user:get(userStore),
                    params:{name:newName},
                }
            )
            updateDBUser(dbuser)            
        },
        async markNotNew (newName) {
            await markUserNotNewRequest.makeRequest({user:get(userStore)});
            await getRemoteUser();
            /* await api.doFetch('markUserNotNew',get(userStore),{})
            await getRemoteUser() */
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
            // api.doFetch('echo',currentUser)
            getUserRequest.makeRequest({user:currentUser}).then(
                (user)=>{
                    currentUser.remoteUser = user
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
