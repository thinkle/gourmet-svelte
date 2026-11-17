// Shared helpers for the dump / compare / apply scripts. No database access
// happens in this file except connect(), which the callers use.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { once } from 'node:events';
import mongodb from 'mongodb';

export const { MongoClient, ObjectID, Binary, Long } = mongodb;

// ---------------------------------------------------------------- arguments

export function parseArgs(argv, { flags = [], options = [] }) {
    const out = {};
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (!a.startsWith('--')) die(`Unexpected argument: ${a}`);
        const name = a.slice(2);
        if (flags.includes(name)) out[name] = true;
        else if (options.includes(name)) {
            if (argv[i + 1] === undefined) die(`--${name} needs a value`);
            out[name] = argv[++i];
        } else die(`Unknown option: ${a}`);
    }
    return out;
}

export function die(message) {
    console.error(`\nStopped: ${message}`);
    process.exit(1);
}

export function stamp(date = new Date()) {
    return date.toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
}

// --------------------------------------------------------------- connection

/**
   A short hash of the host part of the connection string. It lets a dump and
   a later write be tied to the same cluster without ever printing or storing
   the address or the credentials.
*/
export function fingerprint(url) {
    let rest = url.replace(/^[a-z+]+:\/\//i, '');
    rest = rest.slice(rest.lastIndexOf('@') + 1); // drop user:password
    const hosts = rest.split(/[/?]/)[0].toLowerCase();
    return crypto.createHash('sha256').update(hosts).digest('hex').slice(0, 10);
}

export function requireUrl() {
    const url = process.env.MONGO_URL;
    if (!url) die('MONGO_URL is not set. See scripts/migrate/README.md.');
    return url;
}

export async function connect(url) {
    const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    return client;
}

// ------------------------------------------------------------ serialization
// One JSON document per line. BSON types that plain JSON would lose are
// tagged, and anything we do not know how to tag stops the dump rather than
// being written wrongly.

export function encode(value) {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return { $date: value.toISOString() };
    if (Buffer.isBuffer(value)) return { $binary: value.toString('base64'), $subType: 0 };
    if (Array.isArray(value)) return value.map(encode);
    if (typeof value === 'object') {
        const type = value._bsontype;
        if (type === 'ObjectID' || type === 'ObjectId') return { $oid: value.toHexString() };
        if (type === 'Binary') return { $binary: value.buffer.toString('base64'), $subType: value.sub_type };
        if (type === 'Long') return { $numberLong: value.toString() };
        if (type) throw new Error(`Cannot serialize BSON type ${type}`);
        const out = {};
        for (const key of Object.keys(value)) out[key] = encode(value[key]);
        return out;
    }
    return value;
}

export function decode(value) {
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map(decode);
    const keys = Object.keys(value);
    if (keys.length === 1 && keys[0] === '$date') return new Date(value.$date);
    if (keys.length === 1 && keys[0] === '$oid') return new ObjectID(value.$oid);
    if (keys.length === 1 && keys[0] === '$numberLong') return Long.fromString(value.$numberLong);
    if (keys.length === 2 && '$binary' in value && '$subType' in value) {
        return new Binary(Buffer.from(value.$binary, 'base64'), value.$subType);
    }
    const out = {};
    for (const key of keys) out[key] = decode(value[key]);
    return out;
}

export async function writeLine(stream, object) {
    if (!stream.write(JSON.stringify(object) + '\n')) await once(stream, 'drain');
}

export async function closeStream(stream) {
    stream.end();
    await once(stream, 'finish');
}

/** Yields the raw (still tagged) objects of a .jsonl file, one at a time. */
export async function* readLines(file) {
    const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
    for await (const line of rl) {
        if (line.trim()) yield JSON.parse(line);
    }
}

// ------------------------------------------------------------------- dumps

/** `dir` is one database folder inside a dump, e.g. ~/gourmet-dumps/prod-…/Gourmet */
export function readDumpInfo(dir) {
    const dbDir = path.resolve(dir);
    const manifestFile = path.join(dbDir, '..', 'manifest.json');
    const recipesFile = path.join(dbDir, 'recipes.jsonl');
    if (!fs.existsSync(manifestFile) || !fs.existsSync(recipesFile)) {
        die(`${dir} is not a database folder from dump.mjs (expected recipes.jsonl in it and manifest.json beside it).`);
    }
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    return { dbDir, recipesFile, db: path.basename(dbDir), manifest };
}

// --------------------------------------------------------------------- csv

export function toCsv(rows, columns) {
    const cell = (v) => {
        const s = v === undefined || v === null ? '' : String(v);
        return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [columns.join(','), ...rows.map((r) => columns.map((c) => cell(r[c])).join(','))].join('\n') + '\n';
}

export function parseCsv(text) {
    const rows = [];
    let row = [], field = '', quoted = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (quoted) {
            if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
            else if (c === '"') quoted = false;
            else field += c;
        } else if (c === '"') quoted = true;
        else if (c === ',') { row.push(field); field = ''; }
        else if (c === '\n' || c === '\r') {
            if (c === '\r' && text[i + 1] === '\n') i++;
            row.push(field); field = '';
            rows.push(row); row = [];
        } else field += c;
    }
    if (field !== '' || row.length) { row.push(field); rows.push(row); }
    const [header, ...body] = rows.filter((r) => r.some((f) => f !== ''));
    if (!header) return [];
    return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), r[i] ?? ''])));
}
