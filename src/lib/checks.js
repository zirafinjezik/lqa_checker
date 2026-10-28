// Pure check functions. Each returns issue objects: { type, severity, msg }.
// Severities: "error" | "warn" | "pass".

export function charCount(s) {
  return [...s].length; // code points, not UTF-16 units
}

export function checkLength(target, limit) {
  if (!limit || limit <= 0) return [];
  const len = charCount(target);
  if (len > limit) return [{ type: "Length", severity: "error", msg: `${len}/${limit} chars, overflow by ${len - limit}` }];
  return [];
}

export function checkPunctuation(source, target) {
  const issues = [];
  const endRe = /[.!?…:;,]$/;
  const srcEnd = (source.match(endRe) || [])[0];
  const tgtEnd = (target.match(endRe) || [])[0];

  if (srcEnd && !tgtEnd)
    issues.push({ type: "Punctuation", severity: "warn", msg: `Missing ending punctuation, source ends with "${srcEnd}"` });
  else if (!srcEnd && tgtEnd)
    issues.push({ type: "Punctuation", severity: "warn", msg: `Extra ending punctuation, target ends with "${tgtEnd}"` });
  else if (srcEnd && tgtEnd && srcEnd !== tgtEnd)
    issues.push({ type: "Punctuation", severity: "warn", msg: `Punctuation mismatch, source "${srcEnd}" vs target "${tgtEnd}"` });

  const counters = [
    [/\.\.\.|…/g, "Ellipsis"],
    [/!/g, "Exclamation mark"],
    [/\?/g, "Question mark"],
  ];
  for (const [re, label] of counters) {
    const sc = (source.match(re) || []).length;
    const tc = (target.match(re) || []).length;
    if (sc !== tc)
      issues.push({ type: "Punctuation", severity: "warn", msg: `${label} count differs, ${sc} in source, ${tc} in target` });
  }
  return issues;
}

const PLACEHOLDER_RES = [
  /%(?:\d+\$)?[sdif@u]/g, // printf: %s %d %1$s %@
  /\{[^{}\s]*\}/g,        // braces: {0} {name}
  /<[^<>]+>/g,            // tags: <b> </b> <color=red>
  /\\[nt]/g,              // escaped \n \t
];

function extract(text, regexes) {
  const found = [];
  for (const re of regexes) found.push(...(text.match(re) || []));
  return found;
}

function diffCounts(a, b) {
  const tally = arr => arr.reduce((m, x) => { m[x] = (m[x] || 0) + 1; return m; }, {});
  const ca = tally(a), cb = tally(b);
  const missing = [], extra = [];
  for (const k of new Set([...a, ...b])) {
    const d = (ca[k] || 0) - (cb[k] || 0);
    if (d > 0) missing.push(...Array(d).fill(k));
    if (d < 0) extra.push(...Array(-d).fill(k));
  }
  return { missing, extra };
}

export function checkPlaceholders(source, target) {
  const { missing, extra } = diffCounts(extract(source, PLACEHOLDER_RES), extract(target, PLACEHOLDER_RES));
  const issues = [];
  if (missing.length) issues.push({ type: "Placeholder", severity: "error", msg: `Missing in target: ${missing.join(", ")}` });
  if (extra.length) issues.push({ type: "Placeholder", severity: "error", msg: `Extra in target: ${extra.join(", ")}` });
  return issues;
}

export function checkWhitespace(source, target) {
  const issues = [];
  if (/^\s/.test(target) && !/^\s/.test(source))
    issues.push({ type: "Whitespace", severity: "warn", msg: "Leading whitespace in target" });
  if (/\s$/.test(target) && !/\s$/.test(source))
    issues.push({ type: "Whitespace", severity: "warn", msg: "Trailing whitespace in target" });
  const doubles = s => (s.match(/ {2,}/g) || []).length;
  if (doubles(target) > doubles(source))
    issues.push({ type: "Whitespace", severity: "warn", msg: "Double space in target" });
  return issues;
}

// ---------------------------------------------------------------------------
// Numbers
//
// Every number token is turned into a set of candidate values. Two tokens
// match when their sets overlap. With a locale selected the set is usually a
// single value; without one the token is read every plausible way, so
// "1,000" is both one thousand and one point zero. Value mismatches are
// errors. Target formatting that breaks the target locale's notation is a
// warning on top.
// ---------------------------------------------------------------------------

const SEP_CLASS = "[.,'’  ]"; // separators that can sit between digit groups
const NUMBER_RE = new RegExp(`\\d+(?:${SEP_CLASS}\\d+)*`, "g");
// Plain-space grouping (1 000) only when the locale uses it, and only in the
// strict 3-digit shape, so "Level 5 100 coins" still reads as two numbers.
const NUMBER_RE_SPACED = new RegExp(`\\d+(?:(?:${SEP_CLASS}|\\s(?=\\d{3}(?!\\d)))\\d+)*`, "g");

const SPACE_LIKE = s => /^[\s\u00A0\u202F]$/.test(s);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function tokenize(text, loc) {
  // With a locale selected, "10 000" is read as one number; whether a plain
  // space is an accepted separator there is a formatting question, not a
  // value question. Without a locale, spaces always split numbers.
  return text.match(loc && loc.decimal ? NUMBER_RE_SPACED : NUMBER_RE) || [];
}

function keyOf(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(10).replace(/0+$/, "");
}

// No locale: read the token every way it could reasonably be meant.
function lenientValues(tok) {
  const parts = tok.split(/[^\d]/);
  if (parts.length === 1) return [Number(tok)];
  const seps = tok.match(/[^\d]/g);
  const digits = parts.join("");
  const allSame = seps.every(s => s === seps[0]);
  const tailGroups = parts.slice(1).every(p => p.length === 3);

  if (parts.length === 2) {
    const [a, b] = parts;
    if (SPACE_LIKE(seps[0])) return [Number(digits)];
    if (b.length === 3) return [Number(digits), Number(`${a}.${b}`)]; // 1,000 → 1000 or 1.0
    return [Number(`${a}.${b}`)];                                     // 1,5 / 1.25 → decimal
  }
  if (allSame && tailGroups) return [Number(digits)];                 // 1.234.567
  if (parts.slice(1, -1).every(p => p.length === 3) && seps[seps.length - 1] !== seps[0])
    return [Number(`${parts.slice(0, -1).join("")}.${parts[parts.length - 1]}`)]; // 1.234,5
  return [Number(digits)];
}

// Strict locale read. Returns { values, format } where format is null when the
// token is well-formed, otherwise a short description of what is wrong.
function strictValues(tok, loc) {
  const decRe = new RegExp(esc(loc.decimal), "g");
  const decCount = (tok.match(decRe) || []).length;
  if (decCount > 1) return { values: lenientValues(tok), format: null }; // version numbers, IPs, dates: leave alone

  const [intPart, fracPart] = decCount ? tok.split(loc.decimal) : [tok, null];
  if (fracPart !== null && /[^\d]/.test(fracPart)) return { values: lenientValues(tok), format: "malformed" };

  const groups = intPart.split(/[^\d]/);
  const groupSeps = intPart.match(/[^\d]/g) || [];
  const groupOk = groups.length === 1 ||
    (groups[0].length >= 1 && groups[0].length <= 3 && groups.slice(1).every(g => g.length === 3) &&
     groupSeps.every(s => loc.group.includes(s)));
  if (!groupOk) return { values: lenientValues(tok), format: "malformed" };

  const digits = groups.join("");
  const value = Number(fracPart !== null ? `${digits}.${fracPart}` : digits);
  const format = groups.length === 1 && digits.length >= loc.groupFrom && !/^0/.test(digits) ? "ungrouped" : null;
  return { values: [value], format };
}

function describe(loc) {
  const g = loc.group[0];
  const gName = g === "." ? "period" : g === "," ? "comma" : SPACE_LIKE(g) ? "space" : `apostrophe`;
  return `${loc.label}: decimal ${loc.decimal === "," ? "comma" : "period"}, ${gName} for thousands`;
}

export function checkNumbers(source, target, srcLoc, tgtLoc) {
  const read = (tok, loc) => (loc && loc.decimal) ? strictValues(tok, loc) : { values: lenientValues(tok), format: null };

  const src = tokenize(source, srcLoc).map(tok => ({ tok, ...read(tok, srcLoc), used: false }));
  const tgt = tokenize(target, tgtLoc).map(tok => ({ tok, ...read(tok, tgtLoc), used: false }));

  const keys = n => new Set(n.values.map(keyOf));
  for (const s of src) {
    const sk = keys(s);
    const hit = tgt.find(t => !t.used && t.values.some(v => sk.has(keyOf(v))));
    if (hit) { hit.used = true; s.used = true; }
  }

  const issues = [];
  const missing = src.filter(n => !n.used).map(n => n.tok);
  const extra = tgt.filter(n => !n.used).map(n => n.tok);
  if (missing.length) issues.push({ type: "Numbers", severity: "error", msg: `Number missing in target: ${missing.join(", ")}` });
  if (extra.length) issues.push({ type: "Numbers", severity: "error", msg: `Number not in source: ${extra.join(", ")}` });

  if (tgtLoc && tgtLoc.decimal) {
    const malformed = tgt.filter(n => n.format === "malformed").map(n => n.tok);
    const ungrouped = tgt.filter(n => n.format === "ungrouped").map(n => n.tok);
    if (malformed.length)
      issues.push({ type: "Number format", severity: "warn", msg: `${malformed.join(", ")} does not follow ${describe(tgtLoc)}` });
    if (ungrouped.length)
      issues.push({ type: "Number format", severity: "warn", msg: `${ungrouped.join(", ")} has no thousands separator, ${tgtLoc.label} groups from ${tgtLoc.groupFrom} digits` });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Quotation marks (target only, only with a locale selected). Looks at
// double-quote characters outside placeholders and tags.
// ---------------------------------------------------------------------------

const DOUBLE_QUOTES = /["“”„«»]/g;

export function checkQuotes(target, tgtLoc) {
  if (!tgtLoc || !tgtLoc.quotes) return [];
  let text = target;
  for (const re of PLACEHOLDER_RES) text = text.replace(re, " ");
  const found = text.match(DOUBLE_QUOTES) || [];
  if (!found.length) return [];
  const allowed = new Set(tgtLoc.quotes.flat());
  const wrong = [...new Set(found.filter(q => !allowed.has(q)))];
  if (!wrong.length) return [];
  const [open, close] = tgtLoc.quotes[0];
  return [{ type: "Quotes", severity: "warn", msg: `Found ${wrong.join(" ")} in target, ${tgtLoc.label} uses ${open}…${close}` }];
}

export function runChecks(source, target, limit, opts = {}) {
  const { srcLoc, tgtLoc } = opts;
  const issues = [
    ...checkLength(target, limit),
    ...checkPlaceholders(source, target),
    ...checkPunctuation(source, target),
    ...checkWhitespace(source, target),
    ...checkNumbers(source, target, srcLoc, tgtLoc),
    ...checkQuotes(target, tgtLoc),
  ];
  if (issues.length === 0) {
    const info = limit > 0 ? ` (${charCount(target)}/${limit} chars)` : "";
    return [{ type: "All checks", severity: "pass", msg: `No issues found${info}` }];
  }
  return issues;
}

// Paste-mode pairing. Lines are matched strictly by position; interior blank
// lines are preserved so one stray blank line cannot shift every pair below it.
export function pairLines(srcText, tgtText) {
  const clean = t => {
    const lines = t.split("\n");
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines;
  };
  const src = clean(srcText);
  const tgt = clean(tgtText);
  const rows = [];
  for (let i = 0; i < Math.max(src.length, tgt.length); i++) {
    const s = src[i] ?? "";
    const t = tgt[i] ?? "";
    if (!s.trim() && !t.trim()) continue;
    rows.push({ source: s, target: t });
  }
  return rows;
}

export function buildResults(rows, limit, opts = {}) {
  return rows.map(({ source, target }) => {
    if (!source.trim())
      return { source, target, issues: [{ type: "Alignment", severity: "error", msg: "No source for this line, check line pairing" }] };
    if (!target.trim())
      return { source, target, issues: [{ type: "Alignment", severity: "error", msg: "Missing target for this line" }] };
    return { source, target, issues: runChecks(source, target, limit, opts) };
  });
}
