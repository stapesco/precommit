/**
 * Check #1: secrets
 * Scan staged file content for known credential patterns.
 * Excludes lockfiles, .md, test files, and fixtures.
 */

import { DEFAULT_PATTERNS, SECRET_SCAN_EXCLUDE, type SecretPattern } from "../patterns.js";
import type { CheckResult, Finding } from "../runner.js";
import type { StagedFile } from "../util.js";

export interface SecretsConfig {
  enabled: boolean;
  extra_patterns: SecretPattern[];
}

export const defaultSecretsConfig: SecretsConfig = {
  enabled: true,
  extra_patterns: [],
};

export function checkSecrets(files: StagedFile[], config: SecretsConfig): CheckResult {
  const findings: Finding[] = [];
  const patterns = [...DEFAULT_PATTERNS, ...config.extra_patterns];

  for (const file of files) {
    if (!file.content) continue;
    if (SECRET_SCAN_EXCLUDE.some((rx) => rx.test(file.path))) continue;

    for (const pat of patterns) {
      // Reset regex state (because we use the /g flag).
      pat.regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pat.regex.exec(file.content)) !== null) {
        // Find the line number of the match.
        const before = file.content.slice(0, m.index);
        const lineNum = before.split("\n").length;
        // Sanity: skip the match if it's clearly a placeholder.
        const matchText = m[0];
        if (isPlaceholder(matchText)) continue;

        findings.push({file: file.path,
          line: lineNum,
          message: `${pat.name} matched (confidence: ${Math.round(pat.confidence * 100)}%)`,
          evidence: maskSecret(matchText), severity: "block" });
      }
    }
  }

  return {
    name: "secrets",
    passed: findings.length === 0,
    findings,
    summary: findings.length === 0 ? "0 hits" : `${findings.length} hit(s)`,
  };
}

/**
 * Mask the middle of a secret for safe display.
 * "ghp_abc123def456..." -> "ghp_***MASKED***"
 */
function maskSecret(s: string): string {
  if (s.length <= 12) return s[0] + "***" + s[s.length - 1];
  return s.slice(0, 6) + "***MASKED***" + s.slice(-4);
}

/**
 * Skip matches that look like placeholders.
 * Common in tutorials, fixtures, and example code.
 */
function isPlaceholder(s: string): boolean {
  const lower = s.toLowerCase();
  const placeholders = [
    "example",
    "placeholder",
    "your-token",
    "your-key",
    "xxxxx",
    "00000",
    "your-key-here",
    "your-token-here",
    "your-secret-here",
    "<your-",
    "fake",
    "test",
    "dummy",
  ];
  return placeholders.some((p) => lower.includes(p));
}
