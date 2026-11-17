#!/usr/bin/env node
// Offline. Compares the recipes in two dumps and writes a review sheet
// (plan.csv) with a suggested action per source recipe, plus a summary.
// Touches no database.
//
//   node scripts/migrate/compare.mjs --source <dump>/<db> --target <dump>/<db>
//
// Options: --owner <email>  only consider recipes owned by this account
//          --out <dir>      default: a new merge-… folder beside the source dump
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, die, stamp, readDumpInfo, readLines, toCsv } from './lib.mjs';

const args = parseArgs(process.argv.slice(2), { options: ['source', 'target', 'owner', 'out'] });
if (!args.source || !args.target) die('--source and --target are required (database folders from dump.mjs).');

const source = readDumpInfo(args.source);
const target = readDumpInfo(args.target);
if (source.dbDir === target.dbDir) die('Source and target are the same folder.');

// ------------------------------------------------------------- comparison

// Bookkeeping and fields the server derives from the others. They change
// without the recipe changing, so they are left out of every comparison.
const IGNORED = new Set([
    '_id', 'id', 'localid', 'owner', 'last_modified', 'last_remote_save', 'merged',
    'ingTexts', 'flatIngredients', 'fullText', 'savedRemote',
]);

const sha = (s) => crypto.createHash('sha1').update(s).digest('hex');

/** Missing, null, '', [], {} and 0/false flags all mean "nothing here". */
function canonical(value) {
    if (value === null || value === undefined || value === '' || value === false || value === 0) return undefined;
    if (Array.isArray(value)) {
        const items = value.map(canonical).filter((v) => v !== undefined);
        return items.length ? items : undefined;
    }
    if (typeof value === 'object') {
        const out = {};
        for (const key of Object.keys(value).sort()) {
            const v = canonical(value[key]);
            if (v !== undefined) out[key] = v;
        }
        return Object.keys(out).length ? out : undefined;
    }
    return value;
}

function contentFields(rec) {
    const out = {};
    for (const key of Object.keys(rec)) {
        if (IGNORED.has(key)) continue;
        const v = canonical(rec[key]);
        if (v !== undefined) out[key] = JSON.stringify(v);
    }
    return out;
}

const letters = (s) => String(s ?? '').toLowerCase().replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/[^\p{L}]+/gu, '');
const normTitle = (s) => String(s ?? '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function flatIngredients(list, out = []) {
    for (const ing of list || []) {
        if (ing && Array.isArray(ing.ingredients)) flatIngredients(ing.ingredients, out);
        else if (ing) out.push(ing);
    }
    return out;
}

/**
   A looser signature: the words of the title, ingredients and text, with
   numbers, punctuation and markup removed. Two recipes that share it differ
   only in amounts, formatting, or how an ingredient line was parsed
   ("1 1/2 cups flour" as text vs amount 1.5 + unit cups + "flour").
*/
function looseSignature(rec) {
    const ings = flatIngredients(rec.ingredients).map((i) => {
        if (typeof i === 'string') return letters(i);
        return letters(`${i.amount?.unit ?? ''} ${i.text ?? ''}`);
    });
    const texts = (Array.isArray(rec.text) ? rec.text : []).map((t) => letters(t?.body));
    return sha(JSON.stringify([letters(rec.title), ings, texts]));
}

const TEST_TITLE = /\b(test|tests|testing|scratch|untitled|asdf|foo|bar|baz|delete ?me|tmp|temp|sample|example|dummy|new recipe)\b/i;

/** Long strings inside `images` are replaced by a hash so that a few hundred
    recipes with embedded photos fit in memory. */
function slimImages(value) {
    if (typeof value === 'string') return value.length > 2048 ? `sha1:${sha(value)}:${value.length}` : value;
    if (Array.isArray(value)) return value.map(slimImages);
    if (value && typeof value === 'object') {
        const out = {};
        for (const key of Object.keys(value)) out[key] = slimImages(value[key]);
        return out;
    }
    return value;
}

async function load(info) {
    const recs = [];
    for await (const raw of readLines(info.recipesFile)) {
        if (raw.images) raw.images = slimImages(raw.images);
        const owner = raw.owner?.email || '';
        if (args.owner && owner !== args.owner) continue;
        const fields = contentFields(raw);
        const modified = typeof raw.last_modified === 'number' ? raw.last_modified : undefined;
        recs.push({
            id: typeof raw._id === 'string' ? raw._id : JSON.stringify(raw._id),
            owner,
            title: raw.title || '',
            titleKey: normTitle(raw.title),
            deleted: !!raw.deleted,
            modified,
            fields,
            strict: sha(JSON.stringify(Object.keys(fields).sort().map((k) => [k, fields[k]]))),
            loose: looseSignature(raw),
            ings: flatIngredients(raw.ingredients).length,
            images: Array.isArray(raw.images) ? raw.images.length : 0,
            hasText: Array.isArray(raw.text) && raw.text.some((t) => letters(t?.body)),
        });
    }
    return recs;
}

function differingFields(a, b) {
    const keys = new Set([...Object.keys(a.fields), ...Object.keys(b.fields)]);
    return [...keys].filter((k) => a.fields[k] !== b.fields[k]).sort();
}

const iso = (ms) => (ms === undefined ? '' : new Date(ms).toISOString().slice(0, 16).replace('T', ' '));
const newest = (list) => [...list].sort((a, b) => (b.modified || 0) - (a.modified || 0))[0];

// ------------------------------------------------------------------- run

const src = await load(source);
const tgt = await load(target);

const tgtById = new Map(tgt.map((r) => [r.id, r]));
const tgtByTitle = new Map();
for (const r of tgt) {
    if (r.deleted || !r.titleKey) continue;
    const key = `${r.owner}\n${r.titleKey}`;
    if (!tgtByTitle.has(key)) tgtByTitle.set(key, []);
    tgtByTitle.get(key).push(r);
}

const rows = [];
for (const s of src) {
    const row = {
        action: 'skip', class: '', owner: s.owner, title: s.title,
        source_id: s.id, target_id: '', source_modified: iso(s.modified), target_modified: '',
        newer: '', differs: '', src_ings: s.ings, tgt_ings: '', src_images: s.images, tgt_images: '',
        note: '', target_ms: '',
    };
    const notes = [];
    const versus = (t) => {
        row.target_id = t.id;
        row.target_modified = iso(t.modified);
        row.target_ms = t.modified ?? '';
        row.tgt_ings = t.ings;
        row.tgt_images = t.images;
        row.newer = (s.modified || 0) > (t.modified || 0) ? 'source' : (s.modified || 0) < (t.modified || 0) ? 'target' : 'same';
        row.differs = differingFields(s, t).join(' ');
        if (t.images > 0 && s.images === 0) notes.push('target has images, source has none: an update keeps the target images');
    };

    const sameId = tgtById.get(s.id);
    if (s.deleted) {
        row.class = 'deleted-in-source';
        if (sameId) versus(sameId);
    } else if (sameId) {
        versus(sameId);
        if (sameId.deleted) {
            row.class = 'deleted-in-target'; row.action = 'review';
            notes.push('same id exists in target but is marked deleted');
        } else if (sameId.strict === s.strict) row.class = 'identical';
        else if (sameId.loose === s.loose) row.class = 'near-identical';
        else { row.class = 'changed'; row.action = 'review'; }
    } else {
        const titled = tgtByTitle.get(`${s.owner}\n${s.titleKey}`) || [];
        const exact = titled.find((t) => t.strict === s.strict);
        const near = titled.find((t) => t.loose === s.loose);
        if (exact) { versus(exact); row.class = 'identical'; }
        else if (near) { versus(near); row.class = 'near-identical'; }
        else if (titled.length) {
            versus(newest(titled));
            row.class = 'same-title'; row.action = 'review';
            if (titled.length > 1) notes.push(`${titled.length} target recipes have this title; compared with the newest`);
        } else { row.class = 'new'; row.action = 'add'; }
    }

    if (row.class === 'near-identical') notes.push('same words; differs only in numbers, formatting or ingredient parsing');
    if (row.class === 'new' || row.class === 'same-title') {
        const why = !s.titleKey ? 'no title' : TEST_TITLE.test(s.title) ? 'title looks like a test' : (!s.ings && !s.hasText) ? 'no ingredients and no text' : '';
        if (why) { row.action = 'review'; notes.unshift(`test? ${why}`); }
    }
    row._notes = notes;
    row._rec = s;
    rows.push(row);
}

// Copies of the same recipe within the source: keep the newest, skip the rest.
const groups = new Map();
for (const row of rows) {
    if (row.class !== 'new') continue;
    const key = `${row.owner}\n${row._rec.titleKey}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
}
for (const group of groups.values()) {
    if (group.length < 2) continue;
    const keep = newest(group.map((r) => r._rec));
    for (const row of group) {
        if (row._rec === keep) { row._notes.push(`${group.length} source recipes have this title`); continue; }
        if (row._rec.loose === keep.loose) {
            row.action = 'skip'; row.class = 'duplicate-in-source';
            row._notes.unshift(`copy of ${keep.id}, which is newer`);
        } else {
            row.action = 'review';
            row._notes.push(`${group.length} source recipes have this title, with different content`);
        }
    }
}
for (const row of rows) row.note = row._notes.join('; ');

const ORDER = ['changed', 'same-title', 'deleted-in-target', 'new', 'duplicate-in-source', 'near-identical', 'identical', 'deleted-in-source'];
rows.sort((a, b) =>
    (a.action === 'review' ? 0 : 1) - (b.action === 'review' ? 0 : 1)
    || ORDER.indexOf(a.class) - ORDER.indexOf(b.class)
    || a.title.localeCompare(b.title));

// ---------------------------------------------------------------- output

const outDir = path.resolve(args.out || path.join(source.dbDir, '..', '..', `merge-${source.manifest.label}-into-${target.manifest.label}-${stamp()}`));
fs.mkdirSync(outDir, { recursive: true });

const COLUMNS = ['action', 'class', 'owner', 'title', 'source_id', 'target_id', 'source_modified', 'target_modified',
    'newer', 'differs', 'src_ings', 'tgt_ings', 'src_images', 'tgt_images', 'note', 'target_ms'];
fs.writeFileSync(path.join(outDir, 'plan.csv'), toCsv(rows, COLUMNS));
fs.writeFileSync(path.join(outDir, 'plan.json'), JSON.stringify({
    created: new Date().toISOString(),
    source: { dir: source.dbDir, db: source.db, label: source.manifest.label, fingerprint: source.manifest.fingerprint },
    target: { dir: target.dbDir, db: target.db, label: target.manifest.label, fingerprint: target.manifest.fingerprint },
    owner: args.owner || null,
}, null, 2) + '\n');

const count = (list, key) => {
    const out = {};
    for (const item of list) out[key(item)] = (out[key(item)] || 0) + 1;
    return out;
};
const table = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${String(v).padStart(5)}  ${k || '(none)'}`).join('\n');

const srcIds = new Set(src.map((r) => r.id));
const matchedTargets = new Set(rows.map((r) => r.target_id).filter(Boolean));
const onlyInTarget = tgt.filter((r) => !r.deleted && !srcIds.has(r.id) && !matchedTargets.has(r.id)).length;

const summary = `Source: ${source.manifest.label} / ${source.db}  (dumped ${source.manifest.dumped}, cluster ${source.manifest.fingerprint})
Target: ${target.manifest.label} / ${target.db}  (dumped ${target.manifest.dumped}, cluster ${target.manifest.fingerprint})
${source.manifest.fingerprint === target.manifest.fingerprint && source.db === target.db ? '\nWARNING: both dumps are the same database on the same cluster.\n' : ''}
Source recipes by owner:
${table(count(src, (r) => r.owner))}
Target recipes by owner:
${table(count(tgt, (r) => r.owner))}

Source recipes by class:
${table(count(rows, (r) => r.class))}
Suggested action:
${table(count(rows, (r) => r.action))}

Target recipes with no counterpart in the source (left alone): ${onlyInTarget}

Classes
  new                  not in the target by id or title            -> add
  identical            same content already in the target          -> skip
  near-identical       same words; numbers/formatting/parsing differ -> skip (skim these)
  changed              same id, different content                  -> review
  same-title           different id, same title, different content -> review
  deleted-in-target    same id, but deleted in the target          -> review
  duplicate-in-source  an older copy of another source recipe      -> skip
  deleted-in-source    marked deleted in the source                -> skip

Edit the action column of plan.csv: add, update or skip. Rows left as
"review" are skipped by apply.mjs.
  add     insert the source recipe as a new recipe in the target
  update  overwrite target_id with the source content (target images are
          kept when the source has none)
`;
fs.writeFileSync(path.join(outDir, 'summary.txt'), summary);
console.log(summary);
console.log(`Wrote ${path.join(outDir, 'plan.csv')}`);
