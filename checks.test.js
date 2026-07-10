export const css = {
  app: { minHeight: "100vh", width: "100%", boxSizing: "border-box", background: "#111314", color: "#e0e0e0", fontFamily: "'Helvetica Neue', 'Arial', sans-serif", padding: "24px 32px" },
  card: { background: "#1a1d1e", border: "1px solid #2a2e2f", borderRadius: 12, padding: 20, marginBottom: 20, width: "100%", boxSizing: "border-box" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "#666", marginBottom: 6, display: "block" },
  input: { background: "#111314", border: "1px solid #2a2e2f", borderRadius: 8, color: "#e0e0e0", padding: "8px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", outline: "none" },
  textarea: { background: "#111314", border: "1px solid #2a2e2f", borderRadius: 8, color: "#e0e0e0", padding: "10px 12px", fontSize: 13, width: "100%", boxSizing: "border-box", resize: "vertical", outline: "none", minHeight: 120 },
  btn: { background: "linear-gradient(135deg, #0891b2, #22d3ee)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: 0.5 },
  btnGhost: { background: "transparent", color: "#888", border: "1px solid #2a2e2f", borderRadius: 8, padding: "9px 20px", fontWeight: 600, fontSize: 13, cursor: "pointer" },
  tab: active => ({ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, fontSize: 13, transition: "all 0.15s", background: active ? "#0891b2" : "transparent", color: active ? "#fff" : "#666" }),
  select: { background: "#111314", border: "1px solid #2a2e2f", borderRadius: 8, color: "#e0e0e0", padding: "8px 12px", fontSize: 13, outline: "none" },
};

export const SEVERITIES = {
  error: { label: "Error", color: "#ff4d6d", bg: "rgba(255,77,109,0.12)" },
  warn:  { label: "Warning", color: "#ffa94d", bg: "rgba(255,169,77,0.12)" },
  pass:  { label: "Pass", color: "#69db7c", bg: "rgba(105,219,124,0.12)" },
};
