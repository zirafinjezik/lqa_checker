# LQA Checker

A lightweight QA tool for localization teams that checks translated strings for character limit overflows and punctuation consistency between source and target. Supports both direct text input and CSV file uploads.

**Live demo:** [lqa.zirafinjezik.hr](https://lqa.zirafinjezik.hr)

**Repository:** [github.com/zirafinjezik/lqa_checker](https://github.com/zirafinjezik/lqa_checker)

---

## Screenshot

<img width="2487" height="1272" alt="LQA Checker screenshot" src="https://github.com/user-attachments/assets/5a0e3ec0-16a0-4097-8f17-805185b0221e" />

---

## What It Does

- **Character limit validation**: checks target string length (Unicode code points) against a configurable limit and flags overflows
- **Placeholder and tag parity**: `{0}`, `%s`, `%1$s`, `<b>` tags, and `\n` escapes are counted in source and target; any mismatch is an error
- **Punctuation consistency checks**: mismatched ending punctuation, plus ellipsis, exclamation mark, and question mark count differences
- **Whitespace checks**: leading/trailing whitespace and double spaces introduced by the target
- **Number consistency**: numbers are compared by value, not by digit string, so 1,000 vs 1.000 passes while 1.5 vs 15 fails. Without a language selected, ambiguous notations are read every plausible way; with source and target languages selected, each side is read in its own notation (EN 1,000 copied into a German target is caught as 1.0)
- **Number format**: with a target language selected, numbers in the target that break its notation are flagged (wrong decimal separator, wrong thousands separator, five or more digits without grouping)
- **Quotation marks**: with a target language selected, straight quotes and quote styles from other languages are flagged („…“ for German, „…” for Croatian, «…» for Swiss German and French, and so on)
- **Dashes**: with a target language selected, a hyphen doing a dash's job (`word - word`), the wrong dash (em dash in German), hyphens in number ranges (`10-20`) and hyphens as minus signs (`-40`) are flagged. Compounds, product codes and ISO dates are left alone
- **Language presets**: English, German (DE/AT and CH; Swiss German takes the decimal comma in text and the decimal point only after CHF/Fr.), Croatian, French, Italian, Spanish, Dutch, Portuguese, Polish, Czech. Leave both on "Unspecified" for the lenient, language-agnostic behaviour
- **Two input modes**: paste source/target strings directly (one per line) or upload a CSV file with column mapping
- **Summary dashboard**: overview of total strings, errors, warnings, and passes at a glance
- **Expandable results table**: click any row to see detailed issue breakdown with severity badges (Error, Warning, Pass)
- **CSV export of results**: one click, ready to attach to a ticket

---

## Use Cases

**Game UI localization**
You receive a batch of translated UI strings for a mobile game. Before delivery, you paste source and target into the tool, set the character limit per string type, and catch all overflows in seconds – before they become layout bugs in the build.

**Pre-delivery QA check**
You are a freelance translator or LQA reviewer doing a final pass before sending files to the client. You upload your CSV export directly, map the source and target columns, and get a full punctuation and overflow report without opening a CAT tool.

**CAT tool export validation**
You export a batch from memoQ or Trados as CSV. You upload it to the checker, identify punctuation mismatches introduced during translation, and fix them before the file goes back into the TMS.

**Localization PM spot check**
You are a project manager receiving files from multiple linguists. You run each file through the checker to get a quick pass/fail overview before sending to the client, without needing to review each string manually.

---

## Why This Exists

Character overflow and punctuation mismatch are among the most common and easily preventable localization bugs. They are especially critical in game and app UI localization where string length directly affects layout. This tool provides a quick pre-delivery check that catches these issues before they reach the client or end up as bug reports.

---

## Checks Performed

| Check | Severity | Condition |
|---|---|---|
| Character overflow | Error | Target exceeds the specified character limit |
| Missing ending punctuation | Warning | Source ends with punctuation, target does not |
| Extra ending punctuation | Warning | Target has ending punctuation not in source |
| Punctuation mismatch | Warning | Source and target end with different punctuation marks |
| Ellipsis count mismatch | Warning | Different number of ellipses in source vs. target |
| Exclamation mark mismatch | Warning | Different number of exclamation marks in source vs. target |
| Question mark mismatch | Warning | Different number of question marks in source vs. target |
| Placeholder mismatch | Error | Placeholder, tag, or escape present in one side only |
| Whitespace | Warning | Leading/trailing whitespace or double spaces introduced by target |
| Number mismatch | Error | Number value present in one side only (1.5 vs 15, 12 vs 13) |
| Number format | Warning | Target number breaks the target language's notation, or has 5+ digits with no thousands separator (needs a target language) |
| Quotes | Warning | Target uses straight quotes or another language's quote style (needs a target language) |
| Dashes | Warning | Spaced hyphen, wrong dash, hyphen in a number range or as a minus sign (needs a target language) |
| Alignment | Error | Line has a source but no target, or a target but no source |

---

## Input Modes

**Paste Text**: enter source and target strings directly, one string per line. Lines are matched by position.

**CSV Upload**: drag and drop or browse for a CSV file. Select which columns contain source and target strings. Parsed with PapaParse for robust handling of various CSV formats.

---

## Potential Extensions

- Additional checks: placeholder/variable consistency, tag validation, number format verification, leading/trailing whitespace detection
- Export results to CSV or Excel
- Configurable rulesets per project or language pair
- Integration with CAT tool exports (memoQ MQXLIFF, SDLXLIFF)

---

## Tech Stack

- React 18+ with Hooks
- Vite
- PapaParse for CSV parsing
- Deployed on Vercel

---

## Getting Started

```bash
git clone https://github.com/zirafinjezik/lqa_checker.git
cd lqa_checker
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## Part of the LQA Lifecycle Tools

This tool is part of a set of three open-source LQA tools built around the full quality assurance lifecycle:

| Tool | Purpose | Link |
|---|---|---|
| **MQM Error Scorer** | Log errors, score quality, export reports | [mqm.zirafinjezik.hr](https://mqm.zirafinjezik.hr) |
| **LQA Checker** | Validate character limits and punctuation consistency | [lqa.zirafinjezik.hr](https://lqa.zirafinjezik.hr) |
| **LQA Challenge** | Practice and train LQA skills | [game.zirafinjezik.hr](https://game.zirafinjezik.hr) |

---

## Author

**Natalija Marić** – Localization Engineer and LQA specialist with 14+ years of experience in game localization, technical translation, and quality assurance.

- 🦒 [Žirafin jezik j.d.o.o.](https://zirafinjezik.hr)
- 💼 [LinkedIn](https://www.linkedin.com/in/natalija-maric-zirafinjezik)

---

## Privacy

All processing happens in your browser. Pasted text and uploaded CSVs are handled by JavaScript on your machine and are never uploaded, stored, or transmitted anywhere. For confidential content you can also run the tool offline: clone the repo and run it locally. Hosting (Vercel) logs standard access data such as IP addresses, never string content.

## License

MIT
