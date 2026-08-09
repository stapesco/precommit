/**
 * Check #3: console
 * Block console.log and console.warn in .ts/.js/.tsx/.jsx files.
 * Allow console.error (fatal-shutdown paths).
 * Skip tests, scripts/, and lib/log files.
 */

import type { CheckResult, Finding } from "../runner.js";
import type { StagedFile } from "../util.js";

export interface ConsoleConfig {
  enabled: boolean;
  /** Allow console.* in test files (*.test.ts, *.spec.ts). */
  allow_in_tests: boolean;
}

export const defaultConsoleConfig: ConsoleConfig = {
  enabled: true,
  allow_in_tests: true,
};

const TARGET_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

/** Path-segment matcher: returns true if `seg` is a directory segment of `path`. */
function hasPathSegment(path: string, seg: string): boolean {
  const parts = path.split("/");
  return parts.includes(seg);
}

export function checkConsole(files: StagedFile[], config: ConsoleConfig): CheckResult {
  const findings: Finding[] = [];

  for (const file of files) {
    if (!file.content) continue;

    // Skip tests if config allows.
    if (config.allow_in_tests && isTestFile(file.path)) continue;

    // Skip scripts/ as a directory segment (not a substring like
    // "my-scripts" or "scripts-utils" — that was a false-negative bug).
    if (hasPathSegment(file.path, "scripts")) continue;

    // Only scan JS/TS extensions.
    if (!TARGET_EXTS.some((ext) => file.path.endsWith(ext))) continue;

    const lines = file.content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match console.log(...) or console.warn(...) — but NOT console.error.
      // Use a regex that's anchored to the start of the call (allow leading whitespace).
      if (/^\s*console\.(log|warn)\s*\(/.test(line)) {
        findings.push({file: file.path,
          line: i + 1,
          message: `console.log/warn in production code`,
          evidence: line.trim().slice(0, 80), severity: "block"});
      }
    }
  }

  return {
    name: "console",
    passed: findings.length === 0,
    findings,
    summary: findings.length === 0 ? "0 hits" : `${findings.length} hit(s)`,
  };
}

function isTestFile(path: string): boolean {
  return (
    /\.test\.[jt]sx?$/.test(path) ||
    /\.spec\.[jt]sx?$/.test(path) ||
    /__tests__\//.test(path) ||
    /\/tests?\//.test(path)
  );
}
