#!/usr/bin/env node
// Re-reads stored ingredients for a second measure left in the text
// ("285 g unsalted butter (2 1/2 sticks)" -> 285 g, alt 2 1/2 sticks), the way
// the editor now does. Tom runs this; agents do not (AGENTS.md, rule 2).
//
//   MONGO_URL=<db> node scripts/migrate/alt-measures-apply.mjs --dump <dump>/Gourmet
//   MONGO_URL=<db> node scripts/migrate/alt-measures-apply.mjs --dump <dump>/Gourmet --limit 3 --write
//   MONGO_URL=<db> node scripts/migrate/alt-measures-apply.mjs --dump <dump>/Gourmet --write
//   MONGO_URL=<db> node scripts/migrate/alt-measures-apply.mjs --undo <dump>/alt-measures-applied-….jsonl --write
//
// Take a FRESH dump first (scripts/migrate/dump.mjs): the script works out its
// changes from the dump and refuses any recipe that has changed since.
// Without --write nothing is changed, only reported. Only `ingredients` and
// `last_modified` are touched (last_modified so every device re-fetches the
// recipe). Every write is logged with the old ingredients, so --undo works.
// Lines the parser is known to get wrong are left alone and listed:
// see alt-guard.mjs. Run alt-measures-dry-run.mjs first and read its details.
import fs from 'node:fs';
import path from 'node:path';
import {
    parseArgs, die, stamp, requireUrl, fingerprint, connect, encode, decode,
    readLines, writeLine, closeStream, readDumpInfo,
} from './lib.mjs';
import { reparseAltAmounts } from '../../src/utils/ingredientParsing.js';
import { reparseList } from './alt-guard.mjs';

const args = parseArgs(process.argv.slice(2), { flags: ['write'], options: ['dump', 'undo', 'limit'] });
if (!args.dump === !args.undo) die('Give either --dump <database folder of a dump> or --undo <log file>.');
const limit = args.limit ? Number(args.limit) : Infinity;
if (!(limit >= 1)) die('--limit must be a number of recipes, 1 or more.');

// The parser logs debug lines from kept code; keep the report readable.
const log = console.log;
console.log = () => {};
const say = (...a) => log(...a);

const url = requireUrl();
const mode = args.write ? 'WRITE' : 'DRY RUN';

if (args.undo) {
    const logFile = path.resolve(args.undo);
    const meta = JSON.parse(fs.readFileSync(path.join(path.dirname(logFile), 'alt-measures-plan.json'), 'utf8'));
    if (fingerprint(url) !== meta.fingerprint) die('MONGO_URL is not the cluster this run was applied to. Nothing was read or written.');
    const client = await connect(url);
    try { await undo(client.db(meta.db).collection('recipes')); } finally { await client.close(); }
} else {
    const info = readDumpInfo(args.dump);
    if (fingerprint(url) !== info.manifest.fingerprint) die(`MONGO_URL is not the cluster this dump (${info.manifest.label}) came from. Nothing was read or written.`);
    const client = await connect(url);
    try { await apply(info, client.db(info.db).collection('recipes')); } finally { await client.close(); }
}

async function apply(info, recipes) {
    say(`${mode}: ${info.manifest.label}/${info.db}, dump of ${info.manifest.dumped}\n`);
    const steps = [];
    const skipped = {};
    for await (const raw of readLines(info.recipesFile)) {
        if (steps.length >= limit) break;
        const doc = decode(raw);
        if (!Array.isArray(doc.ingredients)) continue;
        const changes = [];
        const next = reparseList(doc.ingredients, reparseAltAmounts, {
            report: (c) => changes.push(c),
            skip: (why) => { skipped[why] = (skipped[why] || 0) + 1; },
        });
        if (changes.length) steps.push({ doc, next, changes });
    }
    say(`${steps.length} recipe(s) to change, ${steps.reduce((n, s) => n + s.changes.length, 0)} ingredient line(s).`);
    say(`Left alone (known bad cases): ${JSON.stringify(skipped)}\n`);

    // Check each against the live database before writing anything.
    const problems = [];
    for (const s of steps) {
        const live = await recipes.findOne({ _id: s.doc._id }, { projection: { last_modified: 1, title: 1 } });
        if (!live) problems.push(`"${s.doc.title}": no longer exists`);
        else if (String(live.last_modified ?? '') !== String(s.doc.last_modified ?? '')) problems.push(`"${s.doc.title}": changed since the dump; dump again`);
    }
    for (const s of steps.slice(0, 40)) {
        say(`  ${s.doc.title}`);
        for (const c of s.changes) say(`      ${c.from}  =>  ${c.to}  + ${c.alts.map((a) => `${a.amount} ${a.unit || ''}`.trim()).join(', ')}`);
    }
    if (steps.length > 40) say(`  … and ${steps.length - 40} more recipes (use alt-measures-dry-run.mjs --details to see them all)`);
    if (problems.length) { say(`\n${problems.length} problem(s):\n` + problems.map((p) => `  ${p}`).join('\n')); die('Dump again and rerun. Nothing was written.'); }
    if (!args.write) return say(`\nAll ${steps.length} checks passed. Nothing was written; add --write to apply (try --limit 3 first).`);

    const stampName = stamp();
    const logFile = path.join(info.dbDir, '..', `alt-measures-applied-${stampName}.jsonl`);
    fs.writeFileSync(path.join(path.dirname(logFile), 'alt-measures-plan.json'), JSON.stringify({ fingerprint: info.manifest.fingerprint, db: info.db }));
    const out = fs.createWriteStream(logFile);
    let done = 0;
    try {
        for (const s of steps) {
            // Log first, so a crash never leaves an unrecorded write.
            await writeLine(out, { _id: encode(s.doc._id), title: s.doc.title, ingredients: encode(s.doc.ingredients), last_modified: s.doc.last_modified });
            const res = await recipes.updateOne(
                { _id: s.doc._id, last_modified: s.doc.last_modified },
                { $set: { ingredients: s.next, last_modified: Date.now() } },
            );
            if (res.matchedCount !== 1) throw new Error(`"${s.doc.title}" changed while applying; it was left alone`);
            done++;
        }
    } finally {
        await closeStream(out);
        say(`\nWrote ${done} of ${steps.length}. Log (for --undo): ${logFile}`);
    }
}

async function undo(recipes) {
    const entries = [];
    for await (const e of readLines(path.resolve(args.undo))) entries.push(e);
    let n = 0;
    for (const e of entries.reverse()) {
        say(`  restore  ${e.title}`);
        if (args.write) await recipes.updateOne({ _id: decode(e._id) }, { $set: { ingredients: decode(e.ingredients), last_modified: Date.now() } });
        n++;
    }
    say(args.write ? `\nUndid ${n} write(s).` : `\n${n} write(s) would be undone. Nothing was changed; add --write to do it.`);
}
