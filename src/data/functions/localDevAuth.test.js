import { getLocalDevUser, localDevAuthAllowed } from './localDevAuth.js';
import { handler } from './api.js';
import { getFakeUser } from './netlifyDevUserMock.js';

const victim = { email: 'someone-else@example.test', name: 'Someone Else' };
const localhostHeaders = {
    referer: 'http://localhost:8888/',
    localuser: JSON.stringify(victim),
};
const fallback = () => ({ email: 'fake@example.test' });

describe('getLocalDevUser', () => {
    it('gives nothing when local dev auth is off, whatever the request says', () => {
        expect(getLocalDevUser({ headers: localhostHeaders }, fallback, false)).toBeUndefined();
        expect(getLocalDevUser({ headers: { referer: 'http://localhost' } }, fallback, false)).toBeUndefined();
    });
    it('is off by default outside a local dev build, even with NETLIFY_DEV set', () => {
        expect(localDevAuthAllowed({ NETLIFY_DEV: 'true' })).toBe(false);
        expect(getLocalDevUser({ headers: localhostHeaders }, fallback)).toBeUndefined();
    });
    it('reads the localuser header when local dev auth is on', () => {
        expect(getLocalDevUser({ headers: localhostHeaders }, fallback, true)).toEqual(victim);
    });
    it('falls back to the fake user when the header is missing or unusable', () => {
        expect(getLocalDevUser({ headers: { referer: 'http://localhost:8888/' } }, fallback, true)).toEqual(fallback());
        expect(getLocalDevUser({ headers: { referer: 'http://localhost:8888/', localuser: '{nope' } }, fallback, true)).toEqual(fallback());
        expect(getLocalDevUser({ headers: { referer: 'http://localhost:8888/', localuser: '{}' } }, fallback, true)).toEqual(fallback());
    });
    it('needs a localhost referer even when on', () => {
        expect(getLocalDevUser({ headers: { ...localhostHeaders, referer: 'https://example.test/' } }, fallback, true)).toBeUndefined();
        expect(getLocalDevUser({ headers: {} }, fallback, true)).toBeUndefined();
        expect(getLocalDevUser({}, fallback, true)).toBeUndefined();
    });
});

// These never reach the database: an unauthenticated request is turned away
// before any query is made.
describe('handler without a signed-in user (as on a deployed build)', () => {
    const rpc = (mode, body = {}) => handler(
        { httpMethod: 'POST', path: '/.netlify/functions/api', headers: localhostHeaders,
          queryStringParameters: { mode }, body: JSON.stringify(body) },
        {}
    );

    it('answers 401 to a localhost referer with a localuser header', async () => {
        const response = await rpc('getRecipes', { secret: 'request-detail' });
        expect(response.statusCode).toBe(401);
    });
    it('does not echo the request or the claimed user back', async () => {
        const response = await rpc('getRecipes', { secret: 'request-detail' });
        expect(Object.keys(JSON.parse(response.body))).toEqual(['error']);
        expect(response.body).not.toContain(victim.email);
        expect(response.body).not.toContain('request-detail');
    });
    it('does not let anyone change the fake user', async () => {
        const before = { ...getFakeUser() };
        const response = await rpc('setFakeUser', { name: 'Mallory', email: 'mallory@example.test' });
        expect(response.statusCode).toBe(401);
        expect(getFakeUser()).toEqual(before);
    });
    it('answers 401 on the REST path too', async () => {
        const response = await handler(
            { httpMethod: 'GET', path: '/.netlify/functions/api/recipes/summary', headers: localhostHeaders,
              queryStringParameters: {} },
            {}
        );
        expect(response.statusCode).toBe(401);
    });
});
