// Number and quotation conventions per target locale.
//
//   decimal   – the decimal separator
//   group     – accepted thousands separators (first entry is the preferred one)
//   groupFrom – integer digit count from which a thousands separator is expected
//               (5 everywhere: four-digit numbers are written solid in most styles,
//               and years must never be flagged)
//   quotes    – accepted double-quote pairs, primary pair first
//   dash      – the parenthetical dash: em dash (—) for EN and FR, en dash (–) otherwise
//   moneyPoint– context before a number where a decimal point is accepted (CH money)
//
// "any" keeps the lenient, locale-agnostic behaviour: values are compared
// across notations, nothing is said about formatting or quote style.

const NBSP = " ";
const NNBSP = " ";

export const LOCALES = {
  any:     { label: "Unspecified" },
  en:      { label: "English",              dash: "\u2014",              decimal: ".", group: [","],                       groupFrom: 5, quotes: [["“", "”"]] },
  de:      { label: "German (DE/AT)",       decimal: ",", group: [".", NNBSP, NBSP],          groupFrom: 5, quotes: [["„", "“"], ["»", "«"]] },
  // Swiss German running text uses the decimal comma (Bundeskanzlei Schreibweisungen);
  // the decimal point is accepted only in money amounts after CHF / Fr. (see checks.js).
  "de-ch": { label: "German (CH)",          decimal: ",", group: ["’", "'", NNBSP, NBSP], groupFrom: 5, quotes: [["«", "»"]], moneyPoint: /(?:CHF|S?Fr\.)\s*$/ },
  hr:      { label: "Croatian",             decimal: ",", group: ["."],                       groupFrom: 5, quotes: [["„", "”"], ["»", "«"]] },
  fr:      { label: "French",               dash: "\u2014",               decimal: ",", group: [NNBSP, NBSP, " "],          groupFrom: 5, quotes: [["«", "»"], ["“", "”"]] },
  it:      { label: "Italian",              decimal: ",", group: ["."],                       groupFrom: 5, quotes: [["«", "»"], ["“", "”"]] },
  es:      { label: "Spanish",              decimal: ",", group: [".", NNBSP, NBSP],          groupFrom: 5, quotes: [["«", "»"], ["“", "”"]] },
  nl:      { label: "Dutch",                decimal: ",", group: ["."],                       groupFrom: 5, quotes: [["“", "”"], ["„", "”"]] },
  pt:      { label: "Portuguese",           decimal: ",", group: [".", NNBSP, NBSP, " "],     groupFrom: 5, quotes: [["«", "»"], ["“", "”"]] },
  pl:      { label: "Polish",               decimal: ",", group: [NNBSP, NBSP, " "],          groupFrom: 5, quotes: [["„", "”"], ["«", "»"]] },
  cs:      { label: "Czech",                decimal: ",", group: [NNBSP, NBSP, " "],          groupFrom: 5, quotes: [["„", "“"], ["»", "«"]] },
};

export const LOCALE_IDS = Object.keys(LOCALES);

export function getLocale(id) {
  return LOCALES[id] || LOCALES.any;
}

export function isStrict(loc) {
  return Boolean(loc && loc.decimal);
}
