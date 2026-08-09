/**
 * Check #5: filesize
 * Block files with sensitive names regardless of content.
 * (catches .env, *.pem, *.key, id_rsa, etc.)
 *
 * Filename-based, distinct from the secrets check (which scans content).
 */

import type { CheckResult, Finding } from "../runner.js";
import type { StagedFile } from "../util.js";

export interface FilesizeConfig {
  enabled: boolean;
}

export const defaultFilesizeConfig: FilesizeConfig = {
  enabled: true,
};

/** Regex of filenames that should NEVER be committed. */
const SENSITIVE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /(?:^|\/)\.env$/, reason: ".env file" },
  { pattern: /(?:^|\/)\.env\.[a-z]+$/, reason: ".env variant" },
  { pattern: /(?:^|\/)id_rsa(?:\.pub)?$/, reason: "SSH private key" },
  { pattern: /(?:^|\/)id_dsa(?:\.pub)?$/, reason: "SSH private key" },
  { pattern: /(?:^|\/)id_ed25519(?:\.pub)?$/, reason: "SSH private key" },
  { pattern: /\.(pem|key|pfx|p12)$/i, reason: "private key" },
  { pattern: /(?:^|\/)credentials\.json$/, reason: "credentials file" },
  { pattern: /(?:^|\/)service-account.*\.json$/, reason: "service account file" },
  { pattern: /(?:^|\/)\.npmrc$/, reason: "npm auth token" },
  { pattern: /(?:^|\/)\.pypirc$/, reason: "pypi auth token" },
  { pattern: /(?:^|\/)\.netrc$/, reason: "netrc credentials" },
  { pattern: /(?:^|\/)secrets?\.(?:yaml|yml|json|toml)$/i, reason: "secrets file" },
  { pattern: /\.(sqlite|sqlite3|db)$/i, reason: "database file" },
];

export function checkFilesize(files: StagedFile[], config: FilesizeConfig): CheckResult {
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
    name: "filesize",
    passed: findings.length === 0,
    findings,
    summary: findings.length === 0 ? "0 hits" : `${findings.length} hit(s)`,
  };
}
