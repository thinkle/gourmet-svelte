/**
   formatMeasure.js

   How one measure of an ingredient reads once the recipe is multiplied:
   the number only (the caller adds the unit). Household measures keep
   Gourmet's natural fractions (1 ⅓, 2–3) through formatAmount. Grams and
   millilitres are shown as decimals and, once scaled, rounded to what a
   scale or jug can show: 150.67 g would be fussy, 150 g is not. At ×1 they are
   shown as stored. See docs/modernization/multiple-measures.md (R5-1).
**/
import { formatAmount } from './numbers.js';

const ROUNDED_METRIC = /^(g|grams?|ml|milliliters?|millilitres?)\.?$/i;
const DECIMAL_METRIC = /^(mg|kg|cl|dl|l|liters?|litres?|lit)\.?$/i;

function trim(n, digits) {
    return String(Number(n.toFixed(digits)));
}

// 4.2 -> 4.2, 37.4 -> 37, 151 -> 150, 1234 -> 1230
function roundForScale(n) {
    const abs = Math.abs(n);
    if (abs < 10) { return trim(n, 1); }
    if (abs < 100) { return String(Math.round(n)); }
    if (abs < 1000) { return String(Math.round(n / 5) * 5); }
    return String(Math.round(n / 10) * 10);
}

function metricNumber(n, scaled, rounded) {
    if (rounded) { return scaled ? roundForScale(n) : trim(n, 1); }
    return trim(n, 2);
}

/**
   The number (or range) of `amount`, multiplied by `mult`. Returns '' when
   there is no number to show. Does not include the unit.
**/
export function formatMeasure(amount, mult = 1) {
    if (!amount || amount.amount == null) { return ''; }
    const unit = String(amount.standardUnit || amount.unit || '').trim();
    const rounded = ROUNDED_METRIC.test(unit);
    if (!rounded && !DECIMAL_METRIC.test(unit)) {
        return formatAmount(amount, { multiplier: mult });
    }
    const scaled = mult !== 1;
    const high = metricNumber(amount.amount * mult, scaled, rounded);
    if (amount.rangeAmount) {
        const low = metricNumber(amount.rangeAmount * mult, scaled, rounded);
        return `${low}–${high}`;
    }
    return high;
}

/**
   Every measure of an ingredient as display strings, primary first:
   ['2 sticks', '225 g']. The unit stays attached to its number with a
   non-breaking space. Measures with no number are left out.
**/
export function formatMeasures(amount, altAmounts, mult = 1) {
    return [amount, ...(Array.isArray(altAmounts) ? altAmounts : [])]
        .map((a) => {
            const n = formatMeasure(a, mult);
            return n ? [n, a.unit].filter(Boolean).join(' ') : '';
        })
        .filter(Boolean);
}
