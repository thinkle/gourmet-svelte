/* See https://github.com/babycourageous/netlify-identity-demo-svelte/blob/master/src/store.js */
import { writable, get } from 'svelte/store'
import { bindIdentity } from '../auth/authenticatedFetch.js'

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

function createUser() {
  const userStore = writable(null);
  const { subscribe, set } = userStore;
  let activeIdentity;

  async function getRemoteUser() {
    const profile = get(userStore);
    if (!profile) throw new Error("Not signed in");
    const remoteUser = await getUserRequest.makeRequest({ user: profile });
    if (get(userStore) === profile) {
      profile.remoteUser = remoteUser;
      profile.signInError = null;
      set(profile);
    }
    return remoteUser;
  }

  async function retrySignIn() {
    const profile = get(userStore);
    if (!profile) return;
    profile.signInError = null;
    set(profile);
    try {
      await getRemoteUser();
    } catch (error) {
      if (get(userStore) === profile) {
        profile.signInError = String(error?.error ?? error?.message ?? error);
        set(profile);
      }
    }
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
    async login(identity) {
      if (!identity || identity === activeIdentity) return;
      activeIdentity = identity;
      const profile = {
        username: identity.user_metadata?.full_name,
        email: identity.email,
        id: identity.id,
      };
      const isCurrent = () => get(userStore) === profile;
      bindIdentity(profile, identity, isCurrent, () => {
        activeIdentity = null;
        try {
          identity.clearSession?.();
        } catch {
          // The app session still ends if browser storage is unavailable.
        }
        set(null);
      });
      set(profile);
      return retrySignIn();
    },
    retrySignIn,
    logout() {
      activeIdentity = null;
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
