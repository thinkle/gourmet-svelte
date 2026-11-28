// The store exposes a profile. Credentials belong to the Identity session,
// including for requests that still hold an older reference to that profile.
const sessions = new WeakMap();

function signedOut() {
  return Object.assign(new Error("Not signed in"), { status: 401 });
}

export function bindIdentity(profile, identity, isCurrent, expire) {
  let pending;
  let lastToken;

  async function token(rejectedToken) {
    if (!isCurrent()) throw signedOut();
    if (pending) {
      const active = pending;
      const jwt = await active.promise;
      if (jwt !== rejectedToken || active.force) return jwt;
    }
    if (!pending) {
      const force = Boolean(rejectedToken && rejectedToken === lastToken);
      const promise = Promise.resolve()
        .then(() => identity.jwt(force))
        .then((jwt) => {
          if (!jwt || !isCurrent()) throw signedOut();
          lastToken = jwt;
          return jwt;
        })
        .catch(() => {
          if (isCurrent()) expire();
          throw signedOut();
        })
        .finally(() => { pending = null; });
      pending = { promise, force };
    }
    return pending.promise;
  }

  sessions.set(profile, { token, isCurrent, expire });
}

export async function authenticatedFetch(profile, url, options, fetcher = fetch) {
  const session = sessions.get(profile);
  if (!session) {
    // Existing local-dev and explicitly supplied credentials.
    return fetcher(url, {
      ...options,
      headers: { ...options.headers, Authorization: 'Bearer ' + (profile?.access_token || '') },
    });
  }

  async function send(token) {
    if (!session.isCurrent()) throw signedOut();
    const response = await fetcher(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
    if (!session.isCurrent()) throw signedOut();
    return response;
  }

  const token = await session.token();
  const response = await send(token);
  if (response.status !== 401 || options.signal?.aborted) return response;

  const retried = await send(await session.token(token));
  if (retried.status === 401) session.expire();
  return retried;
}
