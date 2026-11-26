// The session: the only place that talks to Netlify Identity.
//
// For now this is a thin bridge from the Identity widget to the kept user
// store (`stores/userStore.js`), which is what the request layer reads. Card
// R0-7 replaces it with a proper module (token refresh per request, 401
// retry); nothing outside this file should need to change when it does.
import netlifyIdentity from "netlify-identity-widget";
import { user } from "../stores/userStore.js";

let started = false;

export function startSession() {
  if (started) return;
  started = true;
  netlifyIdentity.on("init", (identityUser) => { if (identityUser) user.login(identityUser); });
  netlifyIdentity.on("login", (identityUser) => { user.login(identityUser); netlifyIdentity.close(); });
  netlifyIdentity.on("logout", () => user.logout());
  netlifyIdentity.init();
}

export const signIn = () => netlifyIdentity.open("login");
export const signUp = () => netlifyIdentity.open("signup");
export const signOut = () => netlifyIdentity.logout();
/** Live shopping refreshes the Identity JWT for each request without copying auth state. */
export async function getToken() {
  const identityUser = netlifyIdentity.currentUser();
  if (!identityUser) throw Object.assign(new Error('Sign in again to resume live shopping.'), { status: 401 });
  return identityUser.jwt();
}
export { user };
