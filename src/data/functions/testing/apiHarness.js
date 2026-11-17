/**
   Test harness for the REST API contract tests.

   Starts an in-memory MongoDB, points MONGO_URL at it, and only THEN loads the
   handler (mongoConnect reads the URL when first imported). Refuses to run if
   MONGO_URL names any host other than 127.0.0.1 / localhost: every real
   environment of this project points at the production database.
**/
const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

export function assertLocalMongoUrl(url) {
    if (!url) { return; }
    const match = /^mongodb:\/\/(?:[^@/]*@)?([^/?]+)/.exec(url);
    const hosts = match ? match[1].split(',').map((h) => h.replace(/:\d+$/, '')) : [];
    if (!hosts.length || !hosts.every((h) => LOCAL_HOSTS.includes(h))) {
        // Deliberately does not echo the URL: it may hold credentials.
        throw new Error('Refusing to run: MONGO_URL does not point at 127.0.0.1 or localhost.');
    }
}

let server;

export async function startApi() {
    // Guard first, before anything can connect: an inherited MONGO_URL must be local.
    assertLocalMongoUrl(process.env.MONGO_URL);
    delete process.env.MONGO_USER;
    delete process.env.MONGO_PASSWORD;
    const { MongoMemoryServer } = require('mongodb-memory-server');
    // $replaceWith pipeline updates need MongoDB >= 4.2. This old
    // mongodb-memory-server asks for arm64 builds that don't exist for 4.x;
    // the x64 build runs under Rosetta.
    if (process.platform === 'darwin' && !process.env.MONGOMS_ARCH) {
        process.env.MONGOMS_ARCH = 'x64';
    }
    server = new MongoMemoryServer({ binary: { version: process.env.MONGOMS_VERSION || '4.4.29' } });
    const uri = await server.getUri();
    assertLocalMongoUrl(uri);
    process.env.MONGO_URL = uri;

    const { handler } = require('../api.js');
    const tokens = require('../tokenFunctions.js');
    const mongo = require('../mongoConnect.js');

    async function reset() {
        const { db } = await mongo.loadDB();
        await db.collection('recipes').deleteMany({});
        await db.collection('api_tokens').deleteMany({});
    }

    // A token minted through the token functions, as the app does.
    async function makeToken(email, scopes) {
        const params = { label: 'contract test' };
        if (scopes) { params.scopes = scopes; }
        const { token, tokenInfo } = await tokens.createApiToken({ email }, params);
        return { token, id: tokenInfo._id };
    }
    async function revoke(email, id) {
        return tokens.revokeApiToken({ email }, { _id: id });
    }

    async function call(method, path, { token, body, query, headers } = {}) {
        const event = {
            httpMethod: method,
            path: '/.netlify/functions/api' + path,
            headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(headers || {}) },
            queryStringParameters: query || null,
            body: body === undefined ? null : JSON.stringify(body),
        };
        const res = await handler(event, {});
        let json;
        try { json = JSON.parse(res.body); } catch (e) { json = undefined; }
        return { status: res.statusCode, json, raw: res.body };
    }

    // Read straight from the database, bypassing the API (so images can be checked).
    async function stored(_id) {
        return mongo.getOne('recipes', { _id });
    }

    async function stop() {
        try {
            const { client } = await mongo.loadDB();
            await client.close();
        } catch (e) { /* nothing to close */ }
        if (server) { await server.stop(); }
    }

    return { call, makeToken, revoke, reset, stored, stop };
}
