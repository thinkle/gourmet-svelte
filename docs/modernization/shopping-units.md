# Shopping unit display (S-2f)

Owner approved implementation on 2026-11-25 after the S-2e investigation.
S-2e records the earlier deferral; this card supersedes it for shopping totals.

## Source evidence

Read-only Python sources under `/Users/thinkle/Projects/gourmet-py2-backup/gourmet/`:

- `shopping.py:53–115`: add compatible quantities, then call `adjust_unit`
  with `favor_current_unit=False`. Singletons bypass it; ranges are scored
  separately and forced into the upper endpoint's unit.
- `convert.py:293–357`: integer/half/quarter/third +1; eighth +0.8; sixth +0.3;
  fifth +0.2; tenth +0.05; otherwise -2. Exactly one gets another +0.5.
  Below/above a preferred range costs -2 plus a proportional penalty.
- `convert.py:385–443`: normally stay in the current unit group, optional +1
  current-unit preference; retain input on ties, otherwise prefer the closest
  unit in the group's order. `item` is explicitly unimplemented here.
- `defaults/defaults_en.py:687–719`: metric ranges 1–999 (kg/l have no upper
  bound); tsp 1/8–5.9, Tbs 1–4, cups 1/4–8, gallons/fl oz >=1. Pints and quarts
  are commented out of the candidate groups.
- `convert.py:498–510` passes ingredient keys into conversion while adding;
  `convert.py:186–201` can use density. This is distinct from unit selection.
- `plugins/unit_display_prefs/__init__.py:36–43` injects user system preferences
  into `get_amount_and_unit`; shopping reads raw `get_amount` and units at
  `shopping.py:314–354`, bypassing that preference hook.
- `test_convert.py:16–25` checks readability and 12 Tbs -> 3/4 cup;
  `shopping.py:417–441` checks addition/ranges (its `tbs.` assertion is stale).

The second checkout, `/Users/thinkle/Projects/from-pebble/Projects/gourmet/gourmet/`,
retains the scorer at `convert.py:330`, selector at `convert.py:422` and English
ranges at `defaults/defaults_en.py:698`. Neither Python application was run.

## Implemented policy and deliberate corrections

`unitAmounts.js` now has actual JS arrays for unit/range pairs and exports
`readabilityScore` and `adjustAmountUnit`. The score/ranges come from Python,
with numerical tolerance at boundaries to avoid floating-point artifacts.
The helper defaults to Python's +1 current-unit bonus; shopping disables it.

Shopping aggregates before selecting a unit, including for singletons. Both
ends of a range convert together; the less readable endpoint determines its
score. A zero endpoint is retained but does not constrain the scale. This fixes
range loss, and avoids Python's choice of a unit that obscures the low endpoint.
Pint/quart inputs can be adjusted, but neither is introduced as a new candidate.
Unknown/count units remain as supplied; matching ones add. Zeroes stay zero.

Fluid ounces remain eligible when the aggregated input unit is fl oz, so
15 fl oz stays 15 fl oz. They are not introduced from cups/tablespoons: 2 cups
stays 2 cups, and 160 Tbs becomes 10 cups rather than Python's 80 fl oz.
Gallons still follow Python's range/scoring rules: 256 Tbs becomes 1 gallon,
even for butter. No ingredient-specific purchasing/package rule is inferred.

`addAmounts` still aggregates in the largest compatible input unit. Display
selection stays within that unit's system and dimension. Density conversion
is deliberately not activated: butter in grams and cups remains two totals.
No user settings UI, stored data, API behavior or recipe-view unit promotion
changes. Original recipe lines and quantities remain unchanged.

## Acceptance examples

| Input | Shopping display |
| --- | --- |
| 10 + 10 Tbs, or a single 20 Tbs | 1 1/4 c |
| 1 1/2 + 1 1/2 tsp | 1 Tbs |
| 1/8 + 1/8 tsp | 1/4 tsp |
| 750 + 750 g | 1 1/2 kg |
| 500 + 500 ml | 1 l |
| 15 fl oz | 15 fl oz |
| 2 c | 2 c |
| 80 + 80 Tbs | 10 c |
| 128 + 128 Tbs | 1 gallon |
| 1 + 1 qt / a single 4 qt | 2 qt / 1 gallon |
| 1–2 cups + 16 Tbs, in either order | 2–3 c |
| 0–16 Tbs | 0–1 c |
| 1–16 Tbs | 1–16 Tbs (avoid obscuring the lower bound) |
| 2 scoops + 3 scoops + 1 bag | 5 scoops + 1 bag |
| 100 g + 100 ml butter | Separate mass and volume totals |

`src/app/shoppingUnits.test.js` exercises these examples, scale/add/select/format
integration, input immutability, zeroes, safe unknown-unit keys and preservation
of physical quantities. Existing contract tests are unchanged.

## Verification

The 22 added regression cases initially produced 16 failures and 6 passes.
After implementation, all 22 pass; the complete app suite has 162 passing tests
(up from 140). Required check tails:

```text
npm run build
✓ built in 3.93s

npm run test:api
Test Suites: 3 passed, 3 total
Tests:       2 skipped, 145 passed, 147 total

npm test -- --run
Test Files  9 passed (9)
Tests       162 passed (162)
```

There is no `npm run check` script in this checkout. The extra kept-utility
Jest suite has identical before/after results: 10 suites pass, 2 fail; 134 tests
pass, 1 fails. The existing failures are the old Jest resolver's `svelte/store`
resolution in `times.test.js`, and `parseUnit` returning `tsp` where its old test
expects `tsp.`. The baseline used unchanged files from starting commit c63d1bf
in an isolated temporary directory. Neither failure was patched or hidden.
Build chunk-size warnings remain. No real database was accessed.

Independent verifier: PASS WITH NOTES; no actionable findings. Independently
repeated build, 145 API tests and 162 app tests successfully. No browser check
was run because this task changes quantity calculation/formatting, not UI markup.
