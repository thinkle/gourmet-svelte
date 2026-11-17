/**
   Local development sign-in.

   Under `netlify dev` there is no Netlify Identity, so the function accepts a
   user named by the browser (the `localuser` header) or falls back to a fake
   one. That must never exist on a deployed site: anyone could send the header.

   Two independent conditions, both required:
   1. LOCAL_DEV_BUILD is replaced by rollup with `true` only in a watch build
      (`npm run dev`). In a production build it is the literal `false`, so the
      code below cannot run whatever the request or environment says.
   2. NETLIFY_DEV, which the Netlify CLI sets for functions it serves locally.
*/
/* global LOCAL_DEV_BUILD */

export function localDevAuthAllowed (env = process.env) {
    const devBuild = typeof LOCAL_DEV_BUILD !== 'undefined' && LOCAL_DEV_BUILD === true;
    return devBuild && env.NETLIFY_DEV === 'true';
}

/**
   The local-dev user for this request, or undefined.
   `allowed` is a parameter so tests can exercise both sides without a build.
*/
export function getLocalDevUser (event, getFallbackUser, allowed = localDevAuthAllowed()) {
    if (!allowed) {
        return undefined;
    }
    const headers = (event && event.headers) || {};
    if (!headers.referer || headers.referer.indexOf('localhost') === -1) {
        return undefined;
    }
    try {
        const user = JSON.parse(headers.localuser);
        if (user && user.email) {
            return user;
        }
    } catch (err) {
        // no usable header: fall through to the fake user
    }
    return getFallbackUser();
}
