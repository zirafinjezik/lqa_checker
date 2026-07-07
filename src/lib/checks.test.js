import { describe, it, expect } from "vitest";
import { charCount, checkLength, checkPunctuation, checkPlaceholders, checkWhitespace, checkNumbers, runChecks, pairLines, buildResults } from "./checks.js";

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

describe("checkNumbers", () => {
  it("missing and extra numbers", () => {
    expect(checkNumbers("Collect 5 gems", "Sakupi dragulje")[0].msg).toContain("5");
    expect(checkNumbers("Collect gems", "Sakupi 5 dragulja")[0].msg).toContain("not in source");
  });

  it("locale separators are not mismatches", () => {
    expect(checkNumbers("1,000 coins", "1.000 novčića")).toEqual([]);
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
