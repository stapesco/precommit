/**
 * Check #5: sensitive-files
 * Block staged files whose names match known sensitive patterns — regardless
 * of content.
 *
 * (Catches .env, *.pem, *.key, id_rsa, *.sqlite, credentials.json, etc.)
 *
 * Filename-based, distinct from the secrets check (which scans content).
 */

import type { CheckResult, Finding } from "../runner.js";
import type { StagedFile } from "../util.js";

export interface SensitiveFilesConfig {
  enabled: boolean;
}

export const defaultSensitiveFilesConfig: SensitiveFilesConfig = {
  enabled: true,
};

/** Regex of filenames that should NEVER be committed. All case-insensitive. */
const SENSITIVE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /(?:^|\/)\.env$/i, reason: ".env file" },
  { pattern: /(?:^|\/)\.env\.[a-z]+$/i, reason: ".env variant" },
  { pattern: /(?:^|\/)id_rsa(?:\.pub)?$/i, reason: "SSH private key" },
  { pattern: /(?:^|\/)id_dsa(?:\.pub)?$/i, reason: "SSH private key" },
  { pattern: /(?:^|\/)id_ed25519(?:\.pub)?$/i, reason: "SSH private key" },
  { pattern: /\.(pem|key|pfx|p12)$/i, reason: "private key" },
  { pattern: /(?:^|\/)credentials\.json$/i, reason: "credentials file" },
  { pattern: /(?:^|\/)service-account.*\.json$/i, reason: "service account file" },
  { pattern: /(?:^|\/)\.npmrc$/i, reason: "npm auth token" },
  { pattern: /(?:^|\/)\.pypirc$/i, reason: "pypi auth token" },
  { pattern: /(?:^|\/)\.netrc$/i, reason: "netrc credentials" },
  { pattern: /(?:^|\/)secrets?\.(?:yaml|yml|json|toml)$/i, reason: "secrets file" },
  { pattern: /\.(sqlite|sqlite3|db)$/i, reason: "database file" },
];

export function checkSensitiveFiles(files: StagedFile[], config: SensitiveFilesConfig): CheckResult {
  const findings: Finding[] = [];

  for (const file of files) {
    const match = SENSITIVE_PATTERNS.find((p) => p.pattern.test(file.path));
    if (match) {
      findings.push({file: file.path,
        line: 0,
        message: `sensitive filename: ${match.reason}`,
        evidence: file.path, severity: "block" });
    }
  }

  return {
    name: "sensitive-files",
    passed: findings.length === 0,
    findings,
    summary: findings.length === 0 ? "0 hits" : `${findings.length} hit(s)`,
  };
}
