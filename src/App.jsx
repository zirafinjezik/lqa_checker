import { useState, useCallback, useRef } from "react";
import * as Papa from "papaparse";

const SEVERITIES = {
  error: { label: "Error", color: "#ff4d6d", bg: "rgba(255,77,109,0.12)" },
  warn:  { label: "Warning", color: "#ffa94d", bg: "rgba(255,169,77,0.12)" },
  pass:  { label: "Pass", color: "#69db7c", bg: "rgba(105,219,124,0.12)" },
};

function checkLength(target, limit) {
  if (!limit || limit <= 0) return null;
  const len = target.length;
  if (len > limit) return { type: "Length", severity: "error", msg: `${len}/${limit} chars, overflow by ${len - limit}` };
  return { type: "Length", severity: "pass", msg: `${len}/${limit} chars, OK` };
}

function checkPunctuation(source, target) {
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

  const countEllipsis = s => (s.match(/\.\.\.|…/g) || []).length;
  const se = countEllipsis(source), te = countEllipsis(target);
  if (se !== te)
    issues.push({ type: "Punctuation", severity: "warn", msg: `Ellipsis count differs, ${se} in source, ${te} in target` });

  const countExcl = s => (s.match(/!/g) || []).length;
  const si = countExcl(source), ti = countExcl(target);
  if (si !== ti)
    issues.push({ type: "Punctuation", severity: "warn", msg: `Exclamation mark count differs, ${si} in source, ${ti} in target` });

  if (issues.length === 0)
    issues.push({ type: "Punctuation", severity: "pass", msg: "No punctuation issues found" });

  return issues;
}

function runChecks(source, target, limit) {
  const all = [];
  const lenCheck = checkLength(target, limit);
  if (lenCheck) all.push(lenCheck);
  all.push(...checkPunctuation(source, target));
  return all;
}

function Badge({ severity }) {
  const s = SEVERITIES[severity];
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.color}`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700,
      letterSpacing: 0.5, textTransform: "uppercase", whiteSpace: "nowrap"
    }}>{s.label}</span>
  );
}

function ResultRow({ index, source, target, issues }) {
  const [open, setOpen] = useState(false);
  const worst = issues.some(i => i.severity === "error") ? "error"
    : issues.some(i => i.severity === "warn") ? "warn" : "pass";
  const s = SEVERITIES[worst];
  return (
    <div style={{ borderBottom: "1px solid #2a2a3a", overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "grid", gridTemplateColumns: "40px 1fr 1fr 100px 32px",
          gap: 12, padding: "10px 16px", cursor: "pointer",
          background: open ? "#1a1a2e" : "transparent",
          transition: "background 0.15s",
          alignItems: "center"
        }}
      >
        <span style={{ color: "#666", fontSize: 12, fontFamily: "monospace" }}>#{index + 1}</span>
        <span style={{ color: "#ccc", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source}</span>
        <span style={{ color: "#aaa", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{target}</span>
        <Badge severity={worst} />
        <span style={{ color: "#555", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "8px 16px 12px 60px", background: "#13131f" }}>
          {issues.map((issue, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "5px 0", borderBottom: i < issues.length - 1 ? "1px solid #1e1e2e" : "none"
            }}>
              <Badge severity={issue.severity} />
              <span style={{ color: "#aaa", fontSize: 12 }}>
                <span style={{ color: "#666", marginRight: 6 }}>{issue.type}:</span>
                {issue.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LQAChecker() {
  const [mode, setMode] = useState("paste");
  const [srcText, setSrcText] = useState("");
  const [tgtText, setTgtText] = useState("");
  const [charLimit, setCharLimit] = useState("");
  const [results, setResults] = useState(null);
  const [csvCols, setCsvCols] = useState({ src: "", tgt: "" });
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [csvData, setCsvData] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const handleCSV = file => {
    Papa.parse(file, {
      header: true, skipEmptyLines: true, dynamicTyping: false,
      complete: ({ data, meta }) => {
        setCsvHeaders(meta.fields || []);
        setCsvData(data);
        setCsvCols({ src: meta.fields?.[0] || "", tgt: meta.fields?.[1] || "" });
        setResults(null);
      }
    });
  };

  const onDrop = useCallback(e => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleCSV(f);
  }, []);

  const analyze = () => {
    const limit = parseInt(charLimit) || 0;
    if (mode === "paste") {
      const srcLines = srcText.split("\n").filter(l => l.trim());
      const tgtLines = tgtText.split("\n").filter(l => l.trim());
      const len = Math.max(srcLines.length, tgtLines.length);
      const r = [];
      for (let i = 0; i < len; i++) {
        const src = srcLines[i] || "";
        const tgt = tgtLines[i] || "";
        r.push({ source: src, target: tgt, issues: runChecks(src, tgt, limit) });
      }
      setResults(r);
    } else {
      if (!csvCols.src || !csvCols.tgt) return;
      const r = csvData.map(row => {
        const src = row[csvCols.src] || "";
        const tgt = row[csvCols.tgt] || "";
        return { source: src, target: tgt, issues: runChecks(src, tgt, limit) };
      });
      setResults(r);
    }
  };

  const summary = results ? {
    total: results.length,
    errors: results.filter(r => r.issues.some(i => i.severity === "error")).length,
    warns: results.filter(r => r.issues.some(i => i.severity === "warn")).length,
    pass: results.filter(r => r.issues.every(i => i.severity === "pass")).length,
  } : null;

  const css = {
    app: { minHeight: "100vh", width: "100%", boxSizing: "border-box", background: "#111314", color: "#e0e0e0", fontFamily: "'Helvetica Neue', 'Arial', sans-serif", padding: "24px 32px" },
    card: { background: "#1a1d1e", border: "1px solid #2a2e2f", borderRadius: 12, padding: 20, marginBottom: 20, width: "100%", boxSizing: "border-box" },
    label: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#666", marginBottom: 6, display: "block" },
    input: { background: "#111314", border: "1px solid #2a2e2f", borderRadius: 8, color: "#e0e0e0", padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" },
    textarea: { background: "#111314", border: "1px solid #2a2e2f", borderRadius: 8, color: "#e0e0e0", padding: "10px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "vertical", outline: "none", minHeight: 120 },
    btn: { background: "linear-gradient(135deg, #0891b2, #22d3ee)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5 },
    tab: active => ({ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s", background: active ? "#0891b2" : "transparent", color: active ? "#fff" : "#666" }),
    select: { background: "#111314", border: "1px solid #2a2e2f", borderRadius: 8, color: "#e0e0e0", padding: "8px 12px", fontSize: 13, outline: "none" },
  };

  return (
    <div style={css.app}>
              <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ background: "linear-gradient(135deg, #22d3ee, #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LQA</span>
            <span style={{ color: "#e0e0e0" }}> Checker</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>Character restriction and punctuation checker</p>
        </div>

        <div style={css.card}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#0d0d1a", padding: 4, borderRadius: 10, width: "fit-content" }}>
            <button style={css.tab(mode === "paste")} onClick={() => { setMode("paste"); setResults(null); }}>Paste Text</button>
            <button style={css.tab(mode === "csv")} onClick={() => { setMode("csv"); setResults(null); }}>CSV / Excel</button>
          </div>

          {mode === "paste" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div>
                <label style={css.label}>Source strings</label>
                <textarea style={css.textarea} placeholder={"One string per line...\nHello, world!\nPress START to begin."} value={srcText} onChange={e => setSrcText(e.target.value)} />
              </div>
              <div>
                <label style={css.label}>Target strings</label>
                <textarea style={css.textarea} placeholder={"Ein String pro Zeile...\nHallo Welt!\nDrücke START, um zu beginnen."} value={tgtText} onChange={e => setTgtText(e.target.value)} />
              </div>
            </div>
          )}

          {mode === "csv" && (
            <div>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileRef.current.click()}
                style={{
                  border: `2px dashed ${dragOver ? "#7c3aed" : "#2a2a3a"}`,
                  borderRadius: 10, padding: 32, textAlign: "center",
                  cursor: "pointer", transition: "border-color 0.2s", marginBottom: 16,
                  background: dragOver ? "rgba(124,58,237,0.05)" : "transparent"
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
                <div style={{ color: "#aaa", fontSize: 13 }}>Drop your CSV file here, or click to browse</div>
                <div style={{ color: "#555", fontSize: 11, marginTop: 4 }}>CSV or Excel exported as CSV</div>
                <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => e.target.files[0] && handleCSV(e.target.files[0])} />
              </div>
              {csvHeaders.length > 0 && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <div>
                    <label style={css.label}>Source column</label>
                    <select style={css.select} value={csvCols.src} onChange={e => setCsvCols(c => ({ ...c, src: e.target.value }))}>
                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={css.label}>Target column</label>
                    <select style={css.select} value={csvCols.tgt} onChange={e => setCsvCols(c => ({ ...c, tgt: e.target.value }))}>
                      {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                  <div style={{ color: "#555", fontSize: 12, alignSelf: "flex-end", paddingBottom: 8 }}>{csvData.length} rows loaded</div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginTop: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={css.label}>Character limit (optional)</label>
              <input style={{ ...css.input, width: 160 }} type="number" placeholder="e.g. 60" value={charLimit} onChange={e => setCharLimit(e.target.value)} />
            </div>
            <button style={css.btn} onClick={analyze}>Run Checks</button>
          </div>
        </div>

        {summary && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Strings", val: summary.total, color: "#60a5fa" },
                { label: "Errors", val: summary.errors, color: "#ff4d6d" },
                { label: "Warnings", val: summary.warns, color: "#ffa94d" },
                { label: "Passed", val: summary.pass, color: "#69db7c" },
              ].map(({ label, val, color }) => (
                <div key={label} style={{ ...css.card, marginBottom: 0, textAlign: "center", padding: "16px 12px" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{val}</div>
                  <div style={{ fontSize: 11, color: "#555", fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ ...css.card, padding: 0, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 100px 32px", gap: 12, padding: "10px 16px", borderBottom: "1px solid #1e1e30" }}>
                {["#", "Source", "Target", "Status", ""].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#444" }}>{h}</span>
                ))}
              </div>
              {results.map((r, i) => <ResultRow key={i} index={i} {...r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}