#!/usr/bin/env node
// Read-only. Copies every collection of every (non-system) database on the
// cluster MONGO_URL points at into .jsonl files outside the repository.
//
//   MONGO_URL=… node scripts/migrate/dump.mjs --label prod
//
// Options: --label <name>   required; names the dump folder (prod, dev, …)
//          --db <name>      dump only this database
//          --out <dir>      default ~/gourmet-dumps
//          --list           only list databases and counts, write nothing
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
    parseArgs, die, stamp, requireUrl, fingerprint, connect, encode, writeLine, closeStream,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2), { flags: ['list'], options: ['label', 'db', 'out'] });
if (!args.list && !/^[\w-]+$/.test(args.label || '')) die('--label <name> is required (letters, digits, - and _).');

const url = requireUrl();
const print = fingerprint(url);
const client = await connect(url);

try {
    let names;
    if (args.db) names = [args.db];
    else {
        const { databases } = await client.db('admin').admin().listDatabases();
        names = databases.map((d) => d.name).filter((n) => !['admin', 'local', 'config'].includes(n));
    }

    console.log(`Cluster fingerprint ${print}`);
    const found = {};
    for (const name of names) {
        const collections = (await client.db(name).listCollections().toArray())
            .filter((c) => c.type !== 'view' && !c.name.startsWith('system.'))
            .map((c) => c.name)
            .sort();
        found[name] = {};
        for (const c of collections) found[name][c] = await client.db(name).collection(c).countDocuments({});
        console.log(`  ${name}: ` + (collections.map((c) => `${c} ${found[name][c]}`).join(', ') || '(empty)'));
    }
    if (args.list) process.exit(0);

    const outDir = path.join(args.out || path.join(os.homedir(), 'gourmet-dumps'), `${args.label}-${stamp()}`);
    fs.mkdirSync(outDir, { recursive: true });

    const written = {};
    for (const name of names) {
        written[name] = {};
        fs.mkdirSync(path.join(outDir, name), { recursive: true });
        for (const c of Object.keys(found[name])) {
            const stream = fs.createWriteStream(path.join(outDir, name, `${c}.jsonl`));
            const cursor = client.db(name).collection(c).find({});
            let n = 0;
            while (await cursor.hasNext()) {
                await writeLine(stream, encode(await cursor.next()));
                n++;
            }
            await closeStream(stream);
            written[name][c] = n;
        }
    }

    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({
        label: args.label,
        fingerprint: print,
        dumped: new Date().toISOString(),
        databases: written,
    }, null, 2) + '\n');

    console.log(`\nWrote ${outDir}`);
    for (const name of names) console.log(`  ${path.join(outDir, name)}`);
} finally {
    await client.close();
}
