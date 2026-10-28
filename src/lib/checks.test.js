import { describe, it, expect } from "vitest";
import { charCount, checkLength, checkPunctuation, checkPlaceholders, checkWhitespace, checkNumbers, checkQuotes, runChecks, pairLines, buildResults } from "./checks.js";
import { getLocale } from "./locales.js";

const msgs = issues => issues.map(i => `${i.severity}:${i.type}`);

describe("charCount / checkLength", () => {
  it("counts code points, not UTF-16 units", () => {
    expect(charCount("Igra 🎮")).toBe(6);
    expect("Igra 🎮".length).toBe(7); // the bug this replaces
  });

  it("flags overflow as error, silent when within limit or no limit", () => {
    expect(checkLength("abcdef", 5)[0].severity).toBe("error");
    expect(checkLength("abc", 5)).toEqual([]);
    expect(checkLength("abc", 0)).toEqual([]);
  });
});

describe("checkPunctuation", () => {
  it("ending punctuation missing / extra / mismatch", () => {
    expect(checkPunctuation("Hello.", "Bok")[0].msg).toContain("Missing ending");
    expect(checkPunctuation("Hello", "Bok.")[0].msg).toContain("Extra ending");
    expect(checkPunctuation("Hello!", "Bok.")[0].msg).toContain("mismatch");
  });

  it("counts ellipses, exclamation and question marks", () => {
    expect(checkPunctuation("Wait...", "Čekaj").some(i => i.msg.includes("Ellipsis"))).toBe(true);
    expect(checkPunctuation("Go! Go!", "Idi!").some(i => i.msg.includes("Exclamation"))).toBe(true);
    expect(checkPunctuation("Ready?", "Spreman").some(i => i.msg.includes("Question"))).toBe(true);
  });

  it("clean pair yields nothing", () => {
    expect(checkPunctuation("Hello!", "Bok!")).toEqual([]);
  });
});

describe("checkPlaceholders", () => {
  it("missing placeholder is an error", () => {
    const issues = checkPlaceholders("You earned {0} coins.", "Zaradio si novčiće.");
    expect(msgs(issues)).toEqual(["error:Placeholder"]);
    expect(issues[0].msg).toContain("{0}");
  });

  it("printf, tags and escaped newlines are all tracked", () => {
    expect(checkPlaceholders("%1$s scored %2$d", "%1$s je postigao %2$d")).toEqual([]);
    expect(checkPlaceholders("<b>Win!</b>", "Pobjeda!")[0].msg).toContain("<b>");
    expect(checkPlaceholders("Line1\\nLine2", "Redak1 Redak2")[0].msg).toContain("\\n");
  });

  it("extra placeholder in target is also an error", () => {
    expect(checkPlaceholders("Press START", "Pritisni {0} START")[0].msg).toContain("Extra in target");
  });

  it("order does not matter, only counts", () => {
    expect(checkPlaceholders("{0} of {1}", "{1} od {0}")).toEqual([]);
  });
});

describe("checkWhitespace", () => {
  it("flags leading, trailing, double spaces introduced by target", () => {
    expect(checkWhitespace("Hi", " Hi")[0].msg).toContain("Leading");
    expect(checkWhitespace("Hi", "Hi ")[0].msg).toContain("Trailing");
    expect(checkWhitespace("A B", "A  B")[0].msg).toContain("Double space");
  });

  it("does not flag whitespace already present in source", () => {
    expect(checkWhitespace(" Hi ", " Bok ")).toEqual([]);
    expect(checkWhitespace("A  B", "A  B")).toEqual([]);
  });
});

describe("checkNumbers, no locale (lenient)", () => {
  it("missing and extra numbers are errors", () => {
    const miss = checkNumbers("Collect 5 gems", "Sakupi dragulje");
    expect(miss[0].msg).toContain("5");
    expect(miss[0].severity).toBe("error");
    expect(checkNumbers("Collect gems", "Sakupi 5 dragulja")[0].msg).toContain("not in source");
  });

  it("locale separators are not mismatches", () => {
    expect(checkNumbers("1,000 coins", "1.000 novčića")).toEqual([]);
    expect(checkNumbers("1.5x damage", "1,5x Schaden")).toEqual([]);
    expect(checkNumbers("1,234.56 kg", "1.234,56 kg")).toEqual([]);
    expect(checkNumbers("0.62 kg", "0,62 kg")).toEqual([]);
    expect(checkNumbers("1,234,567", "1.234.567")).toEqual([]);
  });

  // the three controls from the bug report
  it("decimal change is not a separator change", () => {
    expect(checkNumbers("Damage 1.5", "Damage 15")[0].severity).toBe("error");
    expect(checkNumbers("Coins 1,000", "Coins 1.000")).toEqual([]);
    expect(checkNumbers("Lives 12", "Lives 13")[0].severity).toBe("error");
  });

  it("value changes behind a separator are caught", () => {
    expect(checkNumbers("1.5", "1.50")).toEqual([]);       // same value
    expect(checkNumbers("1.5", "1.55")).toHaveLength(2);    // missing + extra
    expect(checkNumbers("2,5", "25")).toHaveLength(2);
    expect(checkNumbers("1.000", "1000")).toEqual([]);      // ambiguous, overlaps
  });

  it("version numbers and multi-dot tokens compare as themselves", () => {
    expect(checkNumbers("v1.2.3", "v1.2.3")).toEqual([]);
    expect(checkNumbers("v1.2.3", "v1.2.4")).toHaveLength(2);
  });
});

describe("checkNumbers, with locales", () => {
  const en = getLocale("en"), de = getLocale("de"), hr = getLocale("hr"), ch = getLocale("de-ch"), fr = getLocale("fr");

  it("EN→DE: values are read in each language's notation", () => {
    expect(checkNumbers("1,000 coins", "1.000 Münzen", en, de)).toEqual([]);
    expect(checkNumbers("1.5x", "1,5x", en, de)).toEqual([]);
    expect(checkNumbers("1,234.56", "1.234,56", en, de)).toEqual([]);
    // EN 1,000 copied unchanged into DE now means one point zero
    const copied = checkNumbers("1,000 coins", "1,000 Münzen", en, de);
    expect(copied.some(i => i.severity === "error")).toBe(true);
  });

  it("DE→HR: decimal comma on both sides, no ambiguity", () => {
    expect(checkNumbers("1,5 kg", "1,5 kg", de, hr)).toEqual([]);
    expect(checkNumbers("1,5 kg", "15 kg", de, hr)[0].severity).toBe("error");
    expect(checkNumbers("10.000 €", "10.000 €", de, hr)).toEqual([]);
  });

  it("wrong target notation is a warning, value still matched", () => {
    const r = checkNumbers("1.5x", "1.5x", en, de);
    expect(msgs(r)).toEqual(["warn:Number format"]);
    expect(r[0].msg).toContain("1.5");
    const r2 = checkNumbers("1,000", "1,000", de, hr); // 1,000 is a valid HR decimal, so no format warning
    expect(r2).toEqual([]);
  });

  it("thousands separator expected from five digits, not four", () => {
    expect(checkNumbers("10000", "10000", en, de)[0].type).toBe("Number format");
    expect(checkNumbers("2026", "2026", en, de)).toEqual([]);
    expect(checkNumbers("10000", "10.000", en, de)).toEqual([]);
    // plain space in DE: value matches, typography flagged
    expect(msgs(checkNumbers("10000", "10 000", en, de))).toEqual(["warn:Number format"]);
    expect(checkNumbers("10000", "10\u202F000", en, de)).toEqual([]);
  });

  it("Swiss German apostrophe grouping and decimal period", () => {
    expect(checkNumbers("10,000.50", "10’000.50", en, ch)).toEqual([]);
    expect(checkNumbers("10,000.50", "10'000.50", en, ch)).toEqual([]);
    expect(checkNumbers("10,000.50", "10.000,50", en, ch)[0].severity).toBe("warn");
  });

  it("French space grouping", () => {
    expect(checkNumbers("1,000,000", "1 000 000", en, fr)).toEqual([]);
    // a space-grouping target reads "5 100" as one number, by design
    expect(checkNumbers("5 100", "5 100", fr, fr)).toEqual([]);
  });
});

describe("checkQuotes", () => {
  const de = getLocale("de"), hr = getLocale("hr"), en = getLocale("en");

  it("silent without a locale or with the right style", () => {
    expect(checkQuotes('Say "hi"', undefined)).toEqual([]);
    expect(checkQuotes("Sag „Hallo“", de)).toEqual([]);
    expect(checkQuotes("Reci „bok”", hr)).toEqual([]);
    expect(checkQuotes("Say “hi”", en)).toEqual([]);
  });

  it("flags straight and wrong-style quotes", () => {
    expect(checkQuotes('Sag "Hallo"', de)[0].msg).toContain("„…“");
    expect(checkQuotes("Sag “Hallo”", de)[0].severity).toBe("warn");
    expect(checkQuotes("Reci „bok“", hr)[0].msg).toContain("“");
  });

  it("ignores quotes inside tags and placeholders", () => {
    expect(checkQuotes('<color="red">Rot</color>', de)).toEqual([]);
  });
});

describe("runChecks", () => {
  it("clean pair returns a single pass entry with char info", () => {
    const issues = runChecks("Hello!", "Bok!", 20);
    expect(issues).toHaveLength(1);
    expect(issues[0].severity).toBe("pass");
    expect(issues[0].msg).toContain("4/20");
  });
});

describe("pairLines (the misalignment bug)", () => {
  it("a blank line in one side does not shift the pairs below it", () => {
    const rows = pairLines("A\n\nB\nC", "A1\nB1\nC1");
    // old behavior filtered blanks independently: B paired with B1 only by luck,
    // and a blank in the middle of ONE side shifted everything.
    expect(rows[2]).toEqual({ source: "B", target: "C1" }); // strict positional truth
    expect(rows).toHaveLength(4);
  });

  it("trailing newlines do not create ghost rows", () => {
    expect(pairLines("A\nB\n\n", "A1\nB1\n")).toHaveLength(2);
  });

  it("blank on both sides is skipped", () => {
    expect(pairLines("A\n\nB", "A1\n\nB1")).toEqual([
      { source: "A", target: "A1" }, { source: "B", target: "B1" },
    ]);
  });
});

describe("buildResults", () => {
  it("missing target becomes an Alignment error, not noise checks", () => {
    const r = buildResults([{ source: "Hello", target: "" }], 0);
    expect(r[0].issues).toEqual([{ type: "Alignment", severity: "error", msg: "Missing target for this line" }]);
  });

  it("missing source flagged too", () => {
    const r = buildResults([{ source: "", target: "Bok" }], 0);
    expect(r[0].issues[0].msg).toContain("No source");
  });
});
