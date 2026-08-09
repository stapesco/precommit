/**
 * Shared utilities for stapes-precommit.
 * - readStagedFiles: list files staged for commit (with line ranges per file)
 * - readFileContent: read raw file content from disk
 * - color helpers
 */
export declare const c: {
    red: (s: string) => string;
    green: (s: string) => string;
    yellow: (s: string) => string;
    gray: (s: string) => string;
    bold: (s: string) => string;
};
export interface StagedFile {
    /** Path relative to the repo root, leading "./" stripped. */
    path: string;
    /** "A" added, "M" modified, "D" deleted, "R" renamed, "C" copied. */
    status: string;
    /** Original line number range available for the change in the staged tree. */
    content: string;
}
/**
 * Run `git diff --cached --name-status -z` and parse the output.
 * Returns an empty array if not in a git repo or nothing is staged.
 */
export declare function getStagedFiles(repoRoot: string): StagedFile[];
/**
 * Get the repo root, or null if not in a git repo.
 */
export declare function getRepoRoot(): string | null;
/**
 * Format a check name for display.
 */
export declare function padRight(s: string, n: number): string;
/**
 * Format bytes for human-readable display.
 */
export declare function formatBytes(bytes: number): string;
