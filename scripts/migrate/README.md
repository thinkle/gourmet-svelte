# Merging recipes between two databases

Three steps. Only the last one can change anything, and only with `--write`.
Tom runs these; agents do not (AGENTS.md, rule 2).

Dumps go to `~/gourmet-dumps`, outside the repository. They contain every
recipe, user and API token record: do not commit or share them.

## 1. Dump both sides (read-only)

`MONGO_URL` comes from Netlify. This form never shows the value:

```bash
MONGO_URL="$(netlify env:get MONGO_URL --context production)" node scripts/migrate/dump.mjs --label prod
```

```bash
MONGO_URL="$(netlify env:get MONGO_URL --context branch:dev)" node scripts/migrate/dump.mjs --label dev
```

Each run lists every database on that cluster with its collection counts,
then copies all of them. If both commands print the same cluster fingerprint
and the same counts, the two deploys differ some other way (another Netlify
site, or another database name): add `--list` to look without writing, and
`--db <name>` to dump one database.

## 2. Compare (offline)

Source is where recipes come from, target is where they should end up:

```bash
node scripts/migrate/compare.mjs --source ~/gourmet-dumps/dev-…/Gourmet --target ~/gourmet-dumps/prod-…/Gourmet
```

It writes a `merge-…` folder with `summary.txt` and `plan.csv`. Open
`plan.csv` in a spreadsheet, rows needing a decision first, and set `action`
to `add`, `update` or `skip`. Save as CSV in place. Rows left as `review` are
skipped. `--owner <email>` limits it to one account.

## 3. Apply

```bash
MONGO_URL="$(netlify env:get MONGO_URL --context production)" node scripts/migrate/apply.mjs --plan ~/gourmet-dumps/merge-…
```

That is a dry run: it checks every row against the live target and lists what
it would do. Add `--write` to do it. It refuses to run against any cluster
other than the one the target dump came from, and stops before writing if any
target recipe changed since the dump.

- `add` inserts the source recipe unchanged, same id and dates.
- `update` overwrites the target recipe, keeps its id and owner, keeps its
  images when the source has none, and sets `last_modified` to now.

Every write is logged to `applied-….jsonl` in the merge folder. To reverse a
run (dry run first, then with `--write`):

```bash
MONGO_URL="$(netlify env:get MONGO_URL --context production)" node scripts/migrate/apply.mjs --undo ~/gourmet-dumps/merge-…/applied-….jsonl
```

Only recipes are merged. Users, tokens and linked accounts are dumped but
never written.
