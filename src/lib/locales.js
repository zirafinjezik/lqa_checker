// Number and quotation conventions per target locale.
//
//   decimal   – the decimal separator
//   group     – accepted thousands separators (first entry is the preferred one)
//   groupFrom – integer digit count from which a thousands separator is expected
//               (5 everywhere: four-digit numbers are written solid in most styles,
//               and years must never be flagged)
//   quotes    – accepted double-quote pairs, primary pair first
//
// "any" keeps the lenient, locale-agnostic behaviour: values are compared
// across notations, nothing is said about formatting or quote style.

const NBSP = " ";
const NNBSP = " ";

export const LOCALES = {
  any:     { label: "Unspecified" },
  en:      { label: "English",              decimal: ".", group: [","],                       groupFrom: 5, quotes: [["“", "”"]] },
  de:      { label: "German (DE/AT)",       decimal: ",", group: [".", NNBSP, NBSP],          groupFrom: 5, quotes: [["„", "“"], ["»", "«"]] },
  "de-ch": { label: "German (CH)",          decimal: ".", group: ["’", "'", NNBSP, NBSP], groupFrom: 5, quotes: [["«", "»"]] },
  hr:      { label: "Croatian",             decimal: ",", group: ["."],                       groupFrom: 5, quotes: [["„", "”"], ["»", "«"]] },
  fr:      { label: "French",               decimal: ",", group: [NNBSP, NBSP, " "],          groupFrom: 5, quotes: [["«", "»"], ["“", "”"]] },
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
