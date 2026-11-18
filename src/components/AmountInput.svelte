<script>
  // A number the way a cook writes it: "1 1/3", "2/3", "13/9", "1.5", "one
  // and a half". Shows nice fractions (1 ⅓) when you are not editing it, and
  // plain ones (1 1/3) while you are, so they are easy to type over. Up and
  // down (arrow keys, or the buttons) step to the next sensible amount.
  // Parsing, display and stepping are Gourmet's own (utils/numbers.js).
  import { Input, Button } from "contain-css-svelte";
  import { floatToFrac, fracToFloat, increment, decrement } from "../utils/numbers.js";

  // `times` shows the "×" (a multiplier); `unit` follows the box ("Makes [30] cookies").
  let { value = $bindable(1), label = "Amount", min = 0, times = true, unit = "", whole = false } = $props();

  let editing = $state(false);
  let text = $state("");
  // What the box shows when we are not mid-edit.
  $effect(() => { if (!editing) text = floatToFrac(value, { unicodeFractions: false }); });
  const pretty = $derived(floatToFrac(value));

  // utils/numbers.js reads "1.444" as 1444 (European thousands); a plain
  // decimal is never that in a multiplier, so read it as a decimal first.
  function parse(s) {
    const t = String(s).trim();
    if (/^\d*\.\d+$/.test(t)) return Number(t);
    const n = fracToFloat(t);
    return typeof n === "number" && Number.isFinite(n) ? n : NaN;
  }
  const valid = (n) => Number.isFinite(n) && n > min;

  // Take the typed value as soon as it reads as a whole number, but don't
  // fight the typing: "1 1/" is left alone until it becomes "1 1/3".
  function oninput() {
    const n = parse(text);
    if (valid(n)) value = n;
  }
  function commit() {
    editing = false;
    const n = parse(text);
    if (valid(n)) value = n;
    text = floatToFrac(value, { unicodeFractions: false });
  }
  function onkeydown(e) {
    if (e.key === "ArrowUp") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); step(-1); }
    else if (e.key === "Enter") { commit(); e.currentTarget.blur(); }
    else if (e.key === "Escape") { editing = false; e.currentTarget.blur(); }
  }
  function step(dir) {
    // whole: a count of things (eggs), so the buttons go one at a time: 2 ⅔ -> 3, 4 -> 5.
    const next = whole ? (dir > 0 ? Math.floor(value + 1e-9) + 1 : Math.ceil(value - 1e-9) - 1) : dir > 0 ? increment(value) : decrement(value);
    if (valid(next)) value = next;
    if (editing) text = floatToFrac(value, { unicodeFractions: false });
  }
</script>

<span class="amount-input">
  {#if times}<span class="times" aria-hidden="true">×</span>{/if}
  <Input
    aria-label={label}
    value={editing ? text : pretty}
    autocomplete="off"
    spellcheck="false"
    oninput={(e) => { text = e.currentTarget.value; oninput(); }}
    onfocus={(e) => { editing = true; text = floatToFrac(value, { unicodeFractions: false }); queueMicrotask(() => e.currentTarget?.select()); }}
    onblur={commit}
    {onkeydown}
  />
  <span class="steps">
    <Button aria-label="Less" onclick={() => step(-1)}>−</Button>
    <Button aria-label="More" onclick={() => step(1)}>+</Button>
  </span>
  {#if unit}<span class="unit">{unit}</span>{/if}
</span>

<style>
  .amount-input { display: inline-flex; align-items: center; gap: 0.35rem; }
  .times { font-weight: 700; opacity: 0.7; }
  .unit { opacity: 0.8; }
  .amount-input :global(input) {
    inline-size: 4.75rem;
    text-align: center;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
  .steps { display: inline-flex; gap: 0.15rem; }
  .steps :global(button) { min-inline-size: 2rem; padding-inline: 0.4rem; }
</style>
