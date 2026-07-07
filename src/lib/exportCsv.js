import Papa from "papaparse";

export function resultsToCsvRows(results) {
  return results.map((r, i) => {
    const worst = r.issues.some(x => x.severity === "error") ? "Error"
      : r.issues.some(x => x.severity === "warn") ? "Warning" : "Pass";
    return {
      "#": i + 1,
      Source: r.source,
      Target: r.target,
      Status: worst,
      Issues: r.issues.filter(x => x.severity !== "pass").map(x => `${x.type}: ${x.msg}`).join(" | "),
    };
  });
}

export function downloadResultsCsv(results) {
  const csv = Papa.unparse(resultsToCsvRows(results));
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lqa_check_results.csv";
  a.click();
  URL.revokeObjectURL(url);
}
