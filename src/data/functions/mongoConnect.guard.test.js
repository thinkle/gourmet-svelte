import { DB, isLocalMongoUrl, loadDB, assertDisposableDatabase } from './mongoConnect.js';

describe('the one database', () => {
    it('is named on purpose, not left as a build placeholder', () => {
        expect(DB).toBe('Gourmet');
    });
});

describe('isLocalMongoUrl', () => {
    it('accepts only servers on this machine', () => {
        expect(isLocalMongoUrl('mongodb://127.0.0.1:54321/')).toBe(true);
        expect(isLocalMongoUrl('mongodb://localhost:27017/jest?retryWrites=true')).toBe(true);
        expect(isLocalMongoUrl('mongodb://user:p%40ss@127.0.0.1:27017,localhost:27018/db')).toBe(true);
    });
    it('rejects everything else', () => {
        expect(isLocalMongoUrl('mongodb+srv://user:pw@cluster0.example.mongodb.net/Gourmet')).toBe(false);
        expect(isLocalMongoUrl('mongodb+srv://localhost/Gourmet')).toBe(false);
        expect(isLocalMongoUrl('mongodb://db.example.net:27017/')).toBe(false);
        expect(isLocalMongoUrl('mongodb://127.0.0.1:27017,db.example.net:27017/')).toBe(false);
        expect(isLocalMongoUrl('mongodb://localhost.example.net/')).toBe(false);
        expect(isLocalMongoUrl('mongodb://user:pw@127.0.0.1@db.example.net/')).toBe(false);
        expect(isLocalMongoUrl('')).toBe(false);
        expect(isLocalMongoUrl(undefined)).toBe(false);
    });
});

describe('actions that drop a collection', () => {
    const saved = process.env.MONGO_URL;
    afterEach(() => {
        if (saved === undefined) { delete process.env.MONGO_URL; } else { process.env.MONGO_URL = saved; }
    });
    it('are refused against anything but a local in-memory server', () => {
        process.env.MONGO_URL = 'mongodb+srv://user:pw@cluster0.example.mongodb.net/Gourmet';
        expect(() => assertDisposableDatabase('create_recipes')).toThrow(/real database/);
        delete process.env.MONGO_URL;
        expect(() => assertDisposableDatabase('create_users')).toThrow(/real database/);
    });
    it('are allowed against a local in-memory server', () => {
        process.env.MONGO_URL = 'mongodb://127.0.0.1:54321/';
        expect(() => assertDisposableDatabase('create_recipes')).not.toThrow();
    });
});

describe('loadDB under a test runner', () => {
    const saved = process.env.MONGO_URL;
    afterEach(() => {
        if (saved === undefined) { delete process.env.MONGO_URL; } else { process.env.MONGO_URL = saved; }
    });

    it('refuses a remote database before any connection is attempted', async () => {
        process.env.MONGO_URL = 'mongodb+srv://user:pw@cluster0.example.mongodb.net/Gourmet';
        await expect(loadDB()).rejects.toThrow(/Refusing to connect/);
    });
    it('refuses when MONGO_URL is missing', async () => {
        delete process.env.MONGO_URL;
        await expect(loadDB()).rejects.toThrow(/Refusing to connect/);
    });
});
