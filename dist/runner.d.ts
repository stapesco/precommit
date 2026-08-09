/**
 * Runner: orchestrate all 5 checks, summarize output, set exit code.
 *
 * Each check produces a CheckResult with a list of findings. Each finding
 * has a severity of "block" (commit fails) or "warn" (commit may fail in
 * strict mode). The runner classifies the result, prints a summary, prints
 * details for checks with findings, and returns the exit code.
 */
import { defaultSecretsConfig } from "./checks/secrets.js";
import { defaultLargeFilesConfig } from "./checks/large-files.js";
import { defaultConsoleConfig } from "./checks/console.js";
import { defaultTodoConfig } from "./checks/todo.js";
import { defaultSensitiveFilesConfig } from "./checks/sensitive-files.js";
export interface Finding {
    file: string;
    line: number;
    message: string;
    evidence: string;
    /** "block" = commit fails. "warn" = depends on runner strict mode. */
    severity: "block" | "warn";
}
export interface CheckResult {
    name: string;
    passed: boolean;
    findings: Finding[];
    summary: string;
}
export interface RunConfig {
    strict: boolean;
    checks: {
        secrets: typeof defaultSecretsConfig;
        "large-files": typeof defaultLargeFilesConfig;
        console: typeof defaultConsoleConfig;
        todo: typeof defaultTodoConfig;
        "sensitive-files": typeof defaultSensitiveFilesConfig;
    };
}
export declare const defaultRunConfig: RunConfig;
export interface RunOptions {
    /** Override the git repo root. Defaults to `getRepoRoot()`. */
    repoRoot?: string | null;
}
/**
 * Run all enabled checks. When the caller is not in a git repo, the function
 * returns a structured "git" check result rather than exiting the process —
 * this keeps the contract uniform with `--json` callers.
 */
export declare function runAllChecks(config: RunConfig, opts?: RunOptions): CheckResult[];
/**
 * Final structured result for a run. Used by both the human-facing printer
 * and the `--json` emitter. Stable shape — agents consume this directly.
 */
export interface RunReport {
    /** Wall-clock ISO timestamp at run start. */
    startedAt: string;
    /** "0.1.1" — stapes-precommit version. */
    tool: string;
    /** Exit code (0 pass, 1 fail, 2 warn-in-strict). */
    exitCode: number;
    /** Number of checks that ran. */
    checkCount: number;
    failed: number;
    warned: number;
    /** Empty array when there are no findings. */
    findings: Finding[];
}
/**
 * Print summary, print details, return exit code.
 */
export declare function reportAndExit(results: CheckResult[], strict: boolean): number;
/**
 * Build a structured RunReport. Agents consume this directly via `--json`.
 * Pure function — no I/O — so the caller decides where the bytes go.
 */
export declare function buildReport(results: CheckResult[], strict: boolean): RunReport;
/**
 * Emit the structured report as JSON on stdout. Stable key order; agents
 * rely on `exitCode` + `findings[].file` + `findings[].line` + `findings[].message`.
 */
export declare function emitJson(report: RunReport): string;
