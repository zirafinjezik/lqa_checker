import { describe, it, expect } from "vitest";
import { resultsToCsvRows } from "./exportCsv.js";

describe("resultsToCsvRows", () => {
  it("worst severity wins, pass rows have empty issues cell", () => {
    const rows = resultsToCsvRows([
      { source: "a", target: "b", issues: [{ type: "All checks", severity: "pass", msg: "ok" }] },
      { source: "c", target: "d", issues: [{ type: "Length", severity: "error", msg: "overflow" }, { type: "Numbers", severity: "warn", msg: "5" }] },
    ]);
    expect(rows[0].Status).toBe("Pass");
    expect(rows[0].Issues).toBe("");
    expect(rows[1].Status).toBe("Error");
    expect(rows[1].Issues).toBe("Length: overflow | Numbers: 5");
  });
});
