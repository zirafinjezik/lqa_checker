import { useState } from "react";
import Badge from "./Badge.jsx";

export default function ResultRow({ index, source, target, issues }) {
  const [open, setOpen] = useState(false);
  const worst = issues.some(i => i.severity === "error") ? "error"
    : issues.some(i => i.severity === "warn") ? "warn" : "pass";
  return (
    <div style={{ borderBottom: "1px solid #2a2e2f", overflow: "hidden" }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: "grid", gridTemplateColumns: "40px 1fr 1fr 100px 32px",
          gap: 12, padding: "10px 16px", cursor: "pointer",
          background: open ? "#1a1d1e" : "transparent",
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
        <div style={{ padding: "8px 16px 12px 60px", background: "#16191a" }}>
          {issues.map((issue, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, alignItems: "flex-start",
              padding: "5px 0", borderBottom: i < issues.length - 1 ? "1px solid #222627" : "none"
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
