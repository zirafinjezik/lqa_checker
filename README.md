# LQA Checker

A lightweight QA tool for localization teams that checks translated strings for character limit overflows and punctuation consistency between source and target. Supports both direct text input and CSV file uploads.

**Live demo:** [lqa-checker-s7wi.vercel.app](https://lqa-checker-s7wi.vercel.app)

**Repository:** [github.com/zirafinjezik/lqa_checker](https://github.com/zirafinjezik/lqa_checker)

---

## Screenshot

<img width="2487" height="1272" alt="LQA Checker screenshot" src="https://github.com/user-attachments/assets/5a0e3ec0-16a0-4097-8f17-805185b0221e" />

---

## What It Does

- **Character limit validation**: checks target string length against a configurable limit and flags overflows
- **Punctuation consistency checks**: compares source and target for mismatched ending punctuation, ellipsis count differences, and exclamation mark discrepancies
- **Two input modes**: paste source/target strings directly (one per line) or upload a CSV file with column mapping
- **Summary dashboard**: overview of total strings, errors, warnings, and passes at a glance
- **Expandable results table**: click any row to see detailed issue breakdown with severity badges (Error, Warning, Pass)

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
| **MQM Error Scorer** | Log errors, score quality, export reports | [mqm-checker.vercel.app](https://mqm-checker.vercel.app) |
| **LQA Checker** | Validate character limits and punctuation consistency | [lqa-checker-s7wi.vercel.app](https://lqa-checker-s7wi.vercel.app) |
| **LQA Challenge** | Practice and train LQA skills | [lqa-game.vercel.app](https://lqa-game.vercel.app) |

---

## Author

**Natalija Marić** – Localization Engineer and LQA specialist with 14+ years of experience in game localization, technical translation, and quality assurance.

- 🦒 [Žirafin jezik j.d.o.o.](https://zirafinjezik.hr)
- 💼 [LinkedIn](https://www.linkedin.com/in/natalija-maric-zirafinjezik)

---

## License

MIT
