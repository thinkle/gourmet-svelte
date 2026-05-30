/* See https://github.com/babycourageous/netlify-identity-demo-svelte/blob/master/src/store.js */
import { writable, get } from 'svelte/store'

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

function toStoredUser(identityUser) {
  if (!identityUser) {
    return null;
  }
  return {
    username: identityUser?.user_metadata?.full_name,
    email: identityUser.email,
    access_token: identityUser?.token?.access_token,
    expires_at: identityUser?.token?.expires_at,
    refresh_token: identityUser?.token?.refresh_token,
    token_type: identityUser?.token?.token_type,
    id: identityUser.id,
  };
}

function isExpired(userLike) {
  return Boolean(userLike && userLike.expires_at && Number(userLike.expires_at) <= Date.now());
}

// Auth model in this store:
// 1. Local auth snapshot (from gotrue.user): lightweight token + profile data.
// 2. Remote app user (from API): includes DB-linked user metadata used by the app.
// 3. Runtime behavior on startup:
//    - load local snapshot
//    - drop it if token is already expired
//    - fetch remote user to validate session and hydrate DB user info
//    - if validation fails, clear auth state so UI does not stay "half logged in"
//
// On interactive login we also call user.jwt() first, which lets Netlify refresh
// an expiring access token using the refresh token when possible.
function createUser() {
  let localUser;
  try {
    localUser = JSON.parse(localStorage.getItem('gotrue.user'))
  } catch (err) {
    console.log('Bad localUser stored :(', localStorage.getItem('gotrue.user'))
    localStorage.setItem('gotrue.user', 'null');
  }

  let u = toStoredUser(localUser)
  if (isExpired(u)) {
    u = null;
  }

  const userStore = writable(u)
  const { subscribe, set } = userStore;

  async function getRemoteUser() {
    let $user = get(userStore);
    if ($user) {
      let remoteUser = await getUserRequest.makeRequest({ user: $user });
      userStore.update(
        ($user) => {
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

  if (u) {
    getRemoteUser().catch((err) => {
      console.log('Unable to fetch remote user from cached session', err);
      set(null);
    });
  }

  function updateDBUser(dbUser) {
    userStore.update(
      ($user) => {
        if (!$user.remoteUser) {
          $user.remoteUser = {}
        }
        $user.remoteUser.dbUser = dbUser;
        return $user;
      }
    )
  }

  return {
    subscribe,
    async fake(u) {
      set(u);
      try {
        await setFakeUserRequest.makeRequest(
          { user: get(userStore), params: u }
        )
      } catch (err) {
        console.log('Error fetching new user after fake :(', err)
        return;
      }
      await getRemoteUser();
      console.log('Set gotrue...');
      localStorage.setItem('gotrue.user', JSON.stringify(get(userStore)))
      console.log('$user is now', get(userStore))
    },
    async removeLinkedAccount() {
      let result = await removeLinkedAccountRequest.makeRequest(
        { user: get(userStore) }
      )
      updateDBUser(result);
      return

    },
    async acceptLinkedAccount(account) {
      let result = await acceptLinkedAccountRequest.makeRequest(
        {
          user: get(userStore),
          params: { account }
        }
      );
      updateDBUser(result);
      return
    },
    async setInvites(accounts) {
      let result = await setLinkedAccountsRequest.makeRequest(
        {
          user: get(userStore),
          params: { accounts }
        }
      )
      updateDBUser(result);
      return
    },
    async addInvite(account) {
      let result = await addLinkedAccountsRequest.makeRequest(
        {
          user: get(userStore),
          params: { accounts: [account] }
        }
      )
      updateDBUser(result);
      return
    },
    async setName(newName) {
      let dbuser = await setNameRequest.makeRequest(
        {
          user: get(userStore),
          params: { name: newName },
        }
      )
      updateDBUser(dbuser)
    },
    async markNotNew() {
      await markUserNotNewRequest.makeRequest({ user: get(userStore) });
      await getRemoteUser();
    },
    getRemoteUser,
    async login(user) {
      if (!user) {
        set(null);
        return;
      }

      if (typeof user.jwt === 'function') {
        try {
          await user.jwt();
        } catch (err) {
          console.log('Unable to refresh JWT during login', err);
        }
      }

      const currentUser = toStoredUser(user)
      set(currentUser)

      getUserRequest.makeRequest({ user: currentUser }).then(
        (remoteUser) => {
          currentUser.remoteUser = remoteUser
          set(currentUser);
        }
      ).catch((err) => {
        console.log('ERROR FETCHING USER FROM API', err)
        console.log(err)
        set(null);
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
