// Netlify Identity owns the persisted session and refresh credentials.
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
export function signOut() {
  user.logout();
  return netlifyIdentity.logout();
}
export { user };
