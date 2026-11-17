#!/usr/bin/env node
// Carries out a reviewed plan.csv against the target database.
// Without --write it only checks and reports; nothing is changed.
//
//   MONGO_URL=<target> node scripts/migrate/apply.mjs --plan <merge dir>
//   MONGO_URL=<target> node scripts/migrate/apply.mjs --plan <merge dir> --write
//   MONGO_URL=<target> node scripts/migrate/apply.mjs --undo <merge dir>/applied-….jsonl --write
//
// Safety: MONGO_URL must be the cluster the target dump was taken from; every
// row is checked against the live database before anything is written, and
// one failed check stops the whole run; every write is logged with the
// document it replaced, so --undo can put things back.
import fs from 'node:fs';
import path from 'node:path';
import {
    parseArgs, die, stamp, requireUrl, fingerprint, connect, encode, decode,
    readLines, writeLine, closeStream, parseCsv,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2), { flags: ['write'], options: ['plan', 'undo'] });
if (!args.plan === !args.undo) die('Give either --plan <merge dir> or --undo <applied-….jsonl>.');

const planDir = path.resolve(args.plan || path.dirname(args.undo));
const metaFile = path.join(planDir, 'plan.json');
if (!fs.existsSync(metaFile)) die(`No plan.json in ${planDir}. Run compare.mjs first.`);
const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

const url = requireUrl();
if (fingerprint(url) !== meta.target.fingerprint) {
    die(`MONGO_URL is not the cluster the target dump (${meta.target.label}) came from. Nothing was read or written.`);
}

const client = await connect(url);
const recipes = client.db(meta.target.db).collection('recipes');
const mode = args.write ? 'WRITE' : 'DRY RUN';
console.log(`${mode}: ${meta.source.label}/${meta.source.db} -> ${meta.target.label}/${meta.target.db}\n`);

try {
    if (args.undo) await undo();
    else await apply();
} finally {
    await client.close();
}

async function apply() {
    const plan = parseCsv(fs.readFileSync(path.join(planDir, 'plan.csv'), 'utf8'));
    const wanted = [];
    const counts = { add: 0, update: 0, skip: 0, review: 0 };
    for (const [i, row] of plan.entries()) {
        const action = (row.action || '').trim().toLowerCase();
        if (!(action in counts)) die(`plan.csv row ${i + 2}: unknown action "${row.action}" (use add, update or skip).`);
        counts[action]++;
        if (action === 'add' || action === 'update') wanted.push({ ...row, action, line: i + 2 });
    }
    console.log(`Plan: ${counts.add} add, ${counts.update} update, ${counts.skip} skip, ${counts.review} still marked review (skipped)\n`);
    if (!wanted.length) return console.log('Nothing to do.');

    // Full source documents, only for the rows we act on.
    const need = new Set(wanted.map((r) => r.source_id));
    const sourceDocs = new Map();
    for await (const raw of readLines(path.join(meta.source.dir, 'recipes.jsonl'))) {
        const id = typeof raw._id === 'string' ? raw._id : JSON.stringify(raw._id);
        if (need.has(id)) sourceDocs.set(id, decode(raw));
    }

    // Check everything against the live target before writing anything.
    const problems = [];
    const steps = [];
    const seenTargets = new Set();
    for (const row of wanted) {
        const fail = (why) => problems.push(`row ${row.line} "${row.title}": ${why}`);
        const doc = sourceDocs.get(row.source_id);
        if (!doc) { fail('source recipe is not in the source dump'); continue; }
        if (typeof doc._id !== 'string') { fail('source _id is not a string; not handled'); continue; }

        if (row.action === 'add') {
            if (await recipes.findOne({ _id: doc._id }, { projection: { _id: 1 } })) {
                fail('a recipe with this id already exists in the target (use update, or skip)'); continue;
            }
            if (seenTargets.has(doc._id)) { fail('added twice in this plan'); continue; }
            seenTargets.add(doc._id);
            steps.push({ op: 'insert', row, doc });
        } else {
            if (!row.target_id) { fail('update needs a target_id; this row has none (use add)'); continue; }
            if (seenTargets.has(row.target_id)) { fail(`target ${row.target_id} is written by more than one row`); continue; }
            seenTargets.add(row.target_id);
            const before = await recipes.findOne({ _id: row.target_id });
            if (!before) { fail('target recipe no longer exists'); continue; }
            if (String(before.last_modified ?? '') !== String(row.target_ms ?? '')) {
                fail('target recipe changed since the dump; dump and compare again'); continue;
            }
            const keepImages = !(Array.isArray(doc.images) && doc.images.length) && Array.isArray(before.images) && before.images.length;
            const after = {
                ...doc,
                _id: before._id,
                owner: before.owner,
                images: keepImages ? before.images : doc.images,
                last_modified: Date.now(), // so every device with a cached copy fetches the new one
                last_remote_save: new Date(),
                merged: false,
            };
            if (before.localid !== undefined) after.localid = before.localid; else delete after.localid;
            steps.push({ op: 'replace', row, before, doc: after, keepImages });
        }
    }

    for (const s of steps) {
        const extra = s.op === 'replace' ? ` over ${s.before._id}${s.keepImages ? ' (keeping target images)' : ''}` : '';
        console.log(`  ${s.op === 'insert' ? 'add   ' : 'update'}  ${s.row.title}${extra}`);
    }
    if (problems.length) {
        console.log(`\n${problems.length} problem(s):\n` + problems.map((p) => `  ${p}`).join('\n'));
        die('Fix or skip those rows. Nothing was written.');
    }
    if (!args.write) return console.log(`\nAll ${steps.length} checks passed. Nothing was written; run again with --write to apply.`);

    const logFile = path.join(planDir, `applied-${stamp()}.jsonl`);
    const log = fs.createWriteStream(logFile);
    let done = 0;
    try {
        for (const s of steps) {
            // Log first: a crash between the two lines leaves an entry that
            // --undo can still handle, never an unrecorded write.
            if (s.op === 'insert') {
                await writeLine(log, { op: 'insert', _id: s.doc._id });
                await recipes.insertOne(s.doc);
            } else {
                await writeLine(log, { op: 'replace', _id: s.before._id, before: encode(s.before) });
                const res = await recipes.replaceOne({ _id: s.before._id, last_modified: s.before.last_modified }, s.doc);
                if (res.matchedCount !== 1) throw new Error(`"${s.row.title}" changed while applying; it was left alone`);
            }
            done++;
        }
    } finally {
        await closeStream(log);
        console.log(`\nWrote ${done} of ${steps.length}. Log (for --undo): ${logFile}`);
    }
}

async function undo() {
    const entries = [];
    for await (const e of readLines(path.resolve(args.undo))) entries.push(e);
    entries.reverse();
    let n = 0;
    for (const e of entries) {
        if (e.op === 'insert') {
            console.log(`  remove   ${e._id}`);
            if (args.write) await recipes.deleteOne({ _id: e._id });
        } else if (e.op === 'replace') {
            console.log(`  restore  ${e._id}`);
            if (args.write) await recipes.replaceOne({ _id: e._id }, decode(e.before), { upsert: true });
        } else die(`Unknown log entry: ${JSON.stringify(e).slice(0, 80)}`);
        n++;
    }
    console.log(args.write ? `\nUndid ${n} write(s).` : `\n${n} write(s) would be undone. Nothing was changed; add --write to do it.`);
}
