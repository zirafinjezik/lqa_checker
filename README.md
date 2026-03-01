# LQA Checker

A lightweight QA tool for localization teams that checks translated strings for character limit overflows and punctuation consistency between source and target. Supports both direct text input and CSV file uploads.

🔗 **Live demo:** [lqa-checker-s7wi.vercel.app](https://lqa-checker-s7wi.vercel.app)

## What it does

- **Character limit validation**: checks target string length against a configurable limit and flags overflows
- **Punctuation consistency checks**: compares source and target for mismatched ending punctuation, ellipsis count differences, and exclamation mark discrepancies
- **Two input modes**: paste source/target strings directly (one per line) or upload a CSV file with column mapping
- **Summary dashboard**: overview of total strings, errors, warnings, and passes at a glance
- **Expandable results table**: click any row to see detailed issue breakdown with severity badges (Error, Warning, Pass)

## Why this exists

Character overflow and punctuation mismatch are among the most common and easily preventable localization bugs. They are especially critical in game and app UI localization where string length directly affects layout. This tool provides a quick pre-delivery check that catches these issues before they reach the client or end up as bug reports.

## Checks Performed

| Check | Severity | Condition |
|-------|----------|-----------|
| Character overflow | Error | Target exceeds the specified character limit |
| Missing ending punctuation | Warning | Source ends with punctuation, target does not |
| Extra ending punctuation | Warning | Target has ending punctuation not in source |
| Punctuation mismatch | Warning | Source and target end with different punctuation marks |
| Ellipsis count mismatch | Warning | Different number of ellipses in source vs. target |
| Exclamation mark mismatch | Warning | Different number of exclamation marks in source vs. target |

## Input Modes

**Paste Text**: enter source and target strings directly, one string per line. Lines are matched by position.

**CSV Upload**: drag and drop or browse for a CSV file. Select which columns contain source and target strings. Parsed with PapaParse for robust handling of various CSV formats.

## Tech Stack

- React 18+ with Hooks
- Vite
- PapaParse for CSV parsing
- Deployed on Vercel

## Getting Started

```bash
git clone https://github.com/zirafinjezik/lqa-checker.git
cd lqa-checker
npm install
npm run dev
```

## Potential Extensions

- Additional checks: placeholder/variable consistency, tag validation, number format verification, leading/trailing whitespace detection
- Export results to CSV or Excel
- Configurable rulesets per project or language pair
- Integration with CAT tool exports (memoQ MQXLIFF, SDLXLIFF)

## Author

**Natalija Marić** -- Localization specialist and LQA reviewer with 13+ years of experience in game localization, technical translation, and quality assurance.

- 🦒 [Žirafin jezik j.d.o.o.](https://zirafinjezik.com)
- 💼 [LinkedIn](www.linkedin.com/in/natalija-maric-zirafinjezik)

## License

MIT
