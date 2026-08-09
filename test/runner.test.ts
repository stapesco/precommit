import { describe, it, expect } from "vitest";
import { runAllChecks, defaultRunConfig, buildReport, emitJson } from "../src/runner.js";

describe("runAllChecks: not in a git repository", () => {
  it("returns a structured result, not process.exit", () => {
    // Pass repoRoot: null explicitly — simulates the not-in-a-git-repo case
    // without relying on the test runner's CWD.
    const results = runAllChecks(defaultRunConfig, { repoRoot: null });
    expect(results.length).toBe(1);
    expect(results[0].name).toBe("git");
    expect(results[0].passed).toBe(false);
    expect(results[0].findings[0].message).toBe("not in a git repository");
  });

  it("--json emits structured output (not stderr) when not in a git repo", () => {
    const results = runAllChecks(defaultRunConfig, { repoRoot: null });
    const report = buildReport(results, false);
    expect(report.exitCode).toBe(1);
    expect(report.findings.length).toBe(1);
    expect(report.findings[0].message).toBe("not in a git repository");

    const parsed = JSON.parse(emitJson(report));
    expect(parsed.tool).toMatch(/^stapes-precommit@/);
    expect(parsed.exitCode).toBe(1);
    expect(parsed.findings).toBeInstanceOf(Array);
    expect(parsed.findings[0].message).toBe("not in a git repository");
  });
});