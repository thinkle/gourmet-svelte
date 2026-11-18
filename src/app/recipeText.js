// Recipe text blocks, ready to show.
//
// Bodies are stored as HTML (the old editor, the importer, and agents that
// write HTML) or as plain text (agents that do not). Plain text is laid out
// here: blank lines make paragraphs, "1." / "-" lines make lists, a short
// line ending in ":" or in capitals makes a subheading. Every body is then
// sanitized: bodies come from API clients, and they are shown as HTML.
//
// Scalable amounts: a number in the text wrapped in <amount>…</amount>
// ("add <amount>2</amount> eggs", "<amount>1 1/2 cups</amount> milk",
// "<amount>200 g</amount> flour", "<amount>2-3</amount> cloves") is
// multiplied with the recipe (scaleAmounts below). Unwrapped numbers ("bake
// for 20 minutes") never are. The tag has no attributes: what is inside is
// what shows, so the old app and anything that shows HTML naively print the
// plain text. Documented for API clients in src/data/functions/api.js.
import DOMPurify from "dompurify";
import { parseAmount } from "../utils/numbers.js";
import { formatMeasure } from "../utils/formatMeasure.js";

const ALLOWED_TAGS = ["p", "br", "h2", "h3", "h4", "h5", "h6", "ol", "ul", "li", "b", "strong", "i", "em", "u",
  "a", "blockquote", "hr", "sub", "sup", "small", "span", "div", "table", "thead", "tbody", "tr", "th", "td", "img", "amount"];
const ALLOWED_ATTR = ["href", "title", "src", "alt", "colspan", "rowspan"];

const looksLikeHtml = (s) => /<\/?(p|br|ol|ul|li|h[1-6]|b|strong|i|em|div|span|a|table)\b[^>]*>/i.test(s);
// Plain text is escaped, except the <amount> markup, which plain-text bodies
// may carry too.
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/&lt;(\/?)amount&gt;/gi, "<$1amount>");

const ORDERED = /^\s*(\d+)[.)]\s+(.*)$/;
const BULLET = /^\s*[-*•]\s+(.*)$/;
const isHeading = (line) => {
  const t = line.trim();
  if (t.length > 60 || t.length < 2) return false;
  return /:$/.test(t) || (/[A-Z]/.test(t) && t === t.toUpperCase() && !/[.!?]$/.test(t));
};

/** Plain text to simple HTML. */
export function plainToHtml(text) {
  const out = [];
  for (const para of String(text).replace(/\r\n?/g, "\n").split(/\n\s*\n/)) {
    const lines = para.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (ORDERED.test(line) || BULLET.test(line)) {
        const ordered = ORDERED.test(line);
        const re = ordered ? ORDERED : BULLET;
        const items = [];
        while (i < lines.length && re.test(lines[i])) {
          const m = lines[i].match(re);
          items.push(`<li>${escape(ordered ? m[2] : m[1])}</li>`);
          i++;
        }
        out.push(ordered ? `<ol>${items.join("")}</ol>` : `<ul>${items.join("")}</ul>`);
      } else if (isHeading(line) && lines.length > 1 && i === 0) {
        out.push(`<h3>${escape(line.trim().replace(/:$/, ""))}</h3>`);
        i++;
      } else {
        const run = [];
        while (i < lines.length && !ORDERED.test(lines[i]) && !BULLET.test(lines[i])) run.push(escape(lines[i++].trim()));
        out.push(`<p>${run.join("<br>")}</p>`);
      }
    }
  }
  return out.join("\n");
}

/** HTML cleaned to the tags and attributes a body may have. */
export function sanitizeBody(html) {
  return DOMPurify.sanitize(html ?? "", { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
}

/** A stored body as safe HTML for display. */
export function bodyHtml(body) {
  const raw = body ?? "";
  return sanitizeBody(looksLikeHtml(raw) ? raw : plainToHtml(raw));
}

// Unit words whose number is shown changes: "1 cup" doubled is "2 cups".
const SINGULAR_UNITS = {
  cup: "cups", tablespoon: "tablespoons", teaspoon: "teaspoons", pound: "pounds", ounce: "ounces",
  clove: "cloves", can: "cans", stick: "sticks", egg: "eggs", pinch: "pinches", quart: "quarts",
  pint: "pints", gallon: "gallons", liter: "liters", litre: "litres", slice: "slices",
};
const PLURAL_UNITS = Object.fromEntries(Object.entries(SINGULAR_UNITS).map(([a, b]) => [b, a]));

function scaleOne(inner, mult) {
  const text = inner.replace(/&nbsp;/g, " ");
  const parsed = parseAmount(text);
  if (parsed.amount == null || isNaN(parsed.amount) || (parsed.pretext ?? "").trim()) return null;
  const rest = parsed.posttext ?? "";
  const unitWord = (rest.trim().match(/^[\p{L}.]+/u) ?? [""])[0];
  const number = formatMeasure({ amount: parsed.amount, rangeAmount: parsed.rangeAmount, unit: unitWord }, mult);
  if (!number) return null;
  const many = parsed.rangeAmount != null || parsed.amount * mult > 1;
  const lower = unitWord.toLowerCase();
  let after = rest;
  if (many && SINGULAR_UNITS[lower]) after = rest.replace(unitWord, SINGULAR_UNITS[lower]);
  else if (!many && PLURAL_UNITS[lower]) after = rest.replace(unitWord, PLURAL_UNITS[lower]);
  return number + after;
}

/**
   Every <amount>…</amount> in sanitized body HTML multiplied by `mult`,
   formatted like the ingredient list (natural fractions; rounded grams).
   At ×1 the numbers are only re-formatted ("1 1/2" reads "1 ½", as in the
   list). A tag whose content does not start with a number, or that holds
   other markup, is left alone. Amounts at any other multiplier get
   class="scaled" so they can be styled like scaled ingredient amounts.
   Display only: the result is never what gets stored.
**/
export function scaleAmounts(html, mult = 1) {
  if (!html || !Number.isFinite(mult)) return html ?? "";
  return html.replace(/<amount>([^<]*)<\/amount>/gi, (whole, inner) => {
    const scaled = scaleOne(inner, mult);
    if (scaled == null) return whole;
    return mult === 1 ? `<amount>${scaled}</amount>` : `<amount class="scaled">${scaled}</amount>`;
  });
}
