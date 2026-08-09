/**
 * Shared utilities for stapes-precommit.
 * - readStagedFiles: list files staged for commit (with line ranges per file)
 * - readFileContent: read raw file content from disk
 * - color helpers
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// ANSI color codes. Disabled when --no-color or NO_COLOR env var is set.
const useColor = (() => {
  if (process.env.NO_COLOR !== undefined) return false;
  if (process.env.FORCE_COLOR !== undefined) return true;
  return process.stdout.isTTY === true;
})();

export const c = {
  red: (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s),
  green: (s: string) => (useColor ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (useColor ? `\x1b[33m${s}\x1b[0m` : s),
  gray: (s: string) => (useColor ? `\x1b[90m${s}\x1b[0m` : s),
  bold: (s: string) => (useColor ? `\x1b[1m${s}\x1b[0m` : s),
};

export interface StagedFile {
  /** Path relative to the repo root, leading "./" stripped. */
  path: string;
  /** "A" added, "M" modified, "D" deleted, "R" renamed, "C" copied. */
  status: string;
  /** Original line number range available for the change in the staged tree. */
  // (Optional: derived content kept for downstream checks.)
  content: string;
}

/**
 * Run `git diff --cached --name-status -z` and parse the output.
 * Returns an empty array if not in a git repo or nothing is staged.
 */
export function getStagedFiles(repoRoot: string): StagedFile[] {
  let raw: string;
  try {
    raw = execSync("git diff --cached --name-status -z --diff-filter=ACMR", {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch {
    return [];
  }

  // -z output format: pairs of <status>\0<path>\0<oldpath>\0 for renames.
  // For non-renames, each entry is just <status>\0<path>\0.
  const entries = raw.split("\0");
  const files: StagedFile[] = [];
  let i = 0;
  while (i < entries.length) {
    const status = entries[i];
    if (!status) {
      i++;
      continue;
    }
    const path = entries[i + 1];
    if (!path) break;

    if (status.startsWith("R") || status.startsWith("C")) {
      // Rename/copy: skip the old path entries; we just track the new file.
      i += 3;
    } else {
      i += 2;
    }

    // For deleted files, content is empty.
    let content = "";
    if (!status.startsWith("D")) {
      try {
        content = readFileSync(`${repoRoot}/${path}`, "utf8");
      } catch {
        content = "";
      }
    }

    files.push({ path, status, content });
  }
  return files;
}

/**
 * Get the repo root, or null if not in a git repo.
 */
export function getRepoRoot(): string | null {
  try {
    const out = execSync("git rev-parse --show-toplevel", {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim();
  } catch {
    return null;
  }
}

/**
 * Get the diff hunks for a single staged file (used to find line numbers).
 * Returns an empty array if the file is added (no diff exists yet).
 */
export function getStagedDiffLines(repoRoot: string, filePath: string): number[] {
  try {
    const raw = execSync(
      `git diff --cached --unified=0 -- "${filePath}"`,
      { cwd: repoRoot, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const lines = raw.split("\n");
    const result: number[] = [];
    for (const line of lines) {
      // Hunks look like: @@ -0,0 +1,5 @@ or @@ -10,3 +12,5 @@
      const m = line.match(/^@@ \+\d+,(\d+)/);
      if (m) {
        const startLine = parseInt(line.split("+")[1].split(",")[0], 10);
        const count = parseInt(m[1], 10);
        for (let i = 0; i < count; i++) {
          result.push(startLine + i);
        }
      }
    }
    return result;
  } catch {
    return [];
  }
}

/**
 * Format a check name for display.
 */
export function padRight(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

/**
 * Format bytes for human-readable display.
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
