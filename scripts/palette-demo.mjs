// Writes docs/modernization/palette-demo.html: every palette in src/common/colors.js,
// in priority order, with a live box to try a title or category against the rules.
// Uses no recipe data. Run: node scripts/palette-demo.mjs
import fs from "fs";
import { wordColors } from "../src/common/colors.js";

const rows = wordColors.map((w) => ({ src: w.matcher.source, flags: w.matcher.flags, bg: w.color.bg, fg: w.color.fg, contrast: +w.contrast.toFixed(1) }));
const html = `<!doctype html>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Gourmet palettes</title>
<style>
  :root { --ink:#2b1d14; --paper:#fffdf7; --line:#e6dccb; --muted:#7a6a5a; }
  body { margin:0; font:15px/1.4 system-ui,sans-serif; color:var(--ink); background:var(--paper); }
  main { max-width:56rem; margin:0 auto; padding:1.5rem 1rem 4rem; }
  h1 { margin:0 0 .25rem; font-family:Georgia,serif; }
  p.lead { margin:0 0 1rem; color:var(--muted); }
  .try { position:sticky; top:0; background:var(--paper); padding:.75rem 0; border-bottom:1px solid var(--line); z-index:2; }
  .try input { width:100%; box-sizing:border-box; font:inherit; font-size:1.1rem; padding:.55rem .75rem; border:2px solid var(--line); border-radius:.5rem; }
  .result { display:flex; align-items:center; gap:.75rem; margin-top:.6rem; min-height:3rem; }
  .chip { display:inline-flex; align-items:center; padding:.45rem .9rem; border-radius:.6rem; font-family:Georgia,serif; font-weight:600; }
  .row { display:grid; grid-template-columns:2rem 5rem 1fr auto; gap:.75rem; align-items:center; padding:.4rem .25rem; border-bottom:1px solid var(--line); }
  .row.hit { outline:3px solid var(--ink); outline-offset:-2px; border-radius:.4rem; background:#fff7dc; }
  .row.out { opacity:.4; }
  .n { color:var(--muted); text-align:right; font-variant-numeric:tabular-nums; }
  .sw { height:2.4rem; border-radius:.45rem; display:grid; place-items:center; font:700 1rem Georgia,serif; }
  code { font:13px ui-monospace,monospace; word-break:break-word; }
  .c { font-size:12px; color:var(--muted); white-space:nowrap; }
  .c.low { color:#b3261e; font-weight:600; }
  .tier { margin:1.2rem 0 .2rem; font-size:12px; text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
</style>
<main>
  <h1>Recipe palettes</h1>
  <p class="lead">Top to bottom is priority: the first rule that matches a recipe's title or one of its categories wins. Type below to see which one a recipe would get.</p>
  <div class="try">
    <input id="q" placeholder="Try a title or category: &quot;Moroccan Chickpea Stew&quot;" autofocus>
    <div class="result" id="result"></div>
  </div>
  <div id="rows"></div>
</main>
<script>
const rows = ${JSON.stringify(rows)}.map((r) => ({ ...r, re: new RegExp(r.src, r.flags) }));
const el = document.getElementById("rows");
rows.forEach((r, i) => {
  const d = document.createElement("div"); d.className = "row"; r.el = d;
  d.innerHTML = '<span class="n">' + (i + 1) + '</span><div class="sw" style="background:' + r.bg + ';color:' + r.fg + '">Aa</div><code>/' + r.src.replace(/</g, "&lt;") + '/' + r.flags + '</code><span class="c' + (r.contrast < 4.5 ? " low" : "") + '" title="text contrast (below 4.5 is flagged)">' + r.contrast + ':1</span>';
  el.append(d);
});
const q = document.getElementById("q"), out = document.getElementById("result");
function run() {
  const t = q.value.trim();
  rows.forEach((r) => r.el.classList.remove("hit", "out"));
  if (!t) { out.innerHTML = ""; return; }
  const win = rows.find((r) => r.re.test(t));
  rows.forEach((r) => { if (r !== win) r.el.classList.add("out"); });
  if (win) { win.el.classList.add("hit"); win.el.scrollIntoView({ block: "center", behavior: "smooth" });
    out.innerHTML = '<span class="chip" style="background:' + win.bg + ';color:' + win.fg + '"></span> <span>matches rule #' + (rows.indexOf(win) + 1) + '</span>';
    out.firstChild.textContent = t; }
  else out.innerHTML = '<span class="chip" style="background:#7a4443;color:#fff0a3"></span> <span>no rule: the plain brown</span>', out.firstChild.textContent = t;
}
q.addEventListener("input", run);
</script>`;
fs.writeFileSync(new URL("../docs/modernization/palette-demo.html", import.meta.url), html);
console.log("wrote docs/modernization/palette-demo.html,", rows.length, "palettes");
