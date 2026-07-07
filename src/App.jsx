import { useState, useCallback, useRef } from "react";
import Papa from "papaparse";
import { pairLines, buildResults } from "./lib/checks.js";
import { downloadResultsCsv } from "./lib/exportCsv.js";
import { css } from "./theme.js";
import ResultRow from "./components/ResultRow.jsx";

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
      const rows = pairLines(srcText, tgtText);
      if (rows.length === 0) return;
      setResults(buildResults(rows, limit));
    } else {
      if (!csvCols.src || !csvCols.tgt) return;
      const rows = csvData.map(row => ({ source: row[csvCols.src] || "", target: row[csvCols.tgt] || "" }));
      setResults(buildResults(rows, limit));
    }
  };

  const summary = results ? {
    total: results.length,
    errors: results.filter(r => r.issues.some(i => i.severity === "error")).length,
    warns: results.filter(r => r.issues.some(i => i.severity === "warn")).length,
    pass: results.filter(r => r.issues.every(i => i.severity === "pass")).length,
  } : null;

  return (
    <div style={css.app}>
      <div style={{ maxWidth: "100%", margin: "0 auto" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>
            <span style={{ background: "linear-gradient(135deg, #22d3ee, #7dd3fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>LQA</span>
            <span style={{ color: "#e0e0e0" }}> Checker</span>
          </h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 13 }}>Character limits, placeholders, punctuation, whitespace, numbers</p>
        </div>

        <div style={css.card}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20, background: "#16191a", padding: 4, borderRadius: 10, width: "fit-content" }}>
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
                  border: `2px dashed ${dragOver ? "#22d3ee" : "#2a2e2f"}`,
                  borderRadius: 10, padding: 32, textAlign: "center",
                  cursor: "pointer", transition: "border-color 0.2s", marginBottom: 16,
                  background: dragOver ? "rgba(34,211,238,0.05)" : "transparent"
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
              <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 100px 32px", gap: 12, padding: "10px 16px", borderBottom: "1px solid #2a2e2f", alignItems: "center" }}>
                {["#", "Source", "Target", "Status"].map((h, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#444" }}>{h}</span>
                ))}
                <button style={{ ...css.btnGhost, padding: "4px 10px", fontSize: 11, justifySelf: "end", gridColumn: "5" }} onClick={() => downloadResultsCsv(results)} title="Export results as CSV">CSV</button>
              </div>
              {results.map((r, i) => <ResultRow key={i} index={i} {...r} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
