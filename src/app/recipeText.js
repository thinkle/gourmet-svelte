// Recipe text blocks, ready to show.
//
// Bodies are stored as HTML (the old editor, the importer, and agents that
// write HTML) or as plain text (agents that do not). Plain text is laid out
// here: blank lines make paragraphs, "1." / "-" lines make lists, a short
// line ending in ":" or in capitals makes a subheading. Every body is then
// sanitized: bodies come from API clients, and they are shown as HTML.
import DOMPurify from "dompurify";

const ALLOWED_TAGS = ["p", "br", "h2", "h3", "h4", "h5", "h6", "ol", "ul", "li", "b", "strong", "i", "em", "u",
  "a", "blockquote", "hr", "sub", "sup", "small", "span", "div", "table", "thead", "tbody", "tr", "th", "td", "img"];
const ALLOWED_ATTR = ["href", "title", "src", "alt", "colspan", "rowspan"];

const looksLikeHtml = (s) => /<\/?(p|br|ol|ul|li|h[1-6]|b|strong|i|em|div|span|a|table)\b[^>]*>/i.test(s);
const escape = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

/** A stored body as safe HTML for display. */
export function bodyHtml(body) {
  const raw = body ?? "";
  const html = looksLikeHtml(raw) ? raw : plainToHtml(raw);
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR, ALLOW_DATA_ATTR: false });
}
