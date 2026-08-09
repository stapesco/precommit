/**
 * Runner: orchestrate all 5 checks, summarize output, set exit code.
 *
 * Each check produces a CheckResult with a list of findings. Each finding
 * has a severity of "block" (commit fails) or "warn" (commit may fail in
 * strict mode). The runner classifies the result, prints a summary, prints
 * details for checks with findings, and returns the exit code.
 */

import { c, getStagedFiles, getRepoRoot } from "./util.js";
import { checkSecrets, defaultSecretsConfig } from "./checks/secrets.js";
import {
  checkLargeFiles,
  defaultLargeFilesConfig,
} from "./checks/large-files.js";
import { checkConsole, defaultConsoleConfig } from "./checks/console.js";
import { checkTodo, defaultTodoConfig } from "./checks/todo.js";
import { checkFilesize, defaultFilesizeConfig } from "./checks/filesize.js";

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
    filesize: typeof defaultFilesizeConfig;
  };
}

export const defaultRunConfig: RunConfig = {
  strict: false,
  checks: {
    secrets: defaultSecretsConfig,
    "large-files": defaultLargeFilesConfig,
    console: defaultConsoleConfig,
    todo: defaultTodoConfig,
    filesize: defaultFilesizeConfig,
  },
};

export function runAllChecks(config: RunConfig): CheckResult[] {
  const repoRoot = getRepoRoot();
  if (!repoRoot) {
    process.stderr.write(`${c.red("error:")} not in a git repository\n`);
    process.exit(1);
  }

  const files = getStagedFiles(repoRoot);
  if (files.length === 0) {
    process.stderr.write(`${c.gray("no staged files — nothing to check\n")}`);
    return [];
  }

  const results: CheckResult[] = [];
  if (config.checks.secrets.enabled) results.push(checkSecrets(files, config.checks.secrets));
  if (config.checks["large-files"].enabled) results.push(checkLargeFiles(files, repoRoot, config.checks["large-files"]));
  if (config.checks.console.enabled) results.push(checkConsole(files, config.checks.console));
  if (config.checks.todo.enabled) results.push(checkTodo(files, repoRoot, config.checks.todo));
  if (config.checks.filesize.enabled) results.push(checkFilesize(files, config.checks.filesize));
  return results;
}

/**
 * Print summary, print details, return exit code.
 */
export function reportAndExit(results: CheckResult[], strict: boolean): number {
  if (results.length === 0) return 0;
  const counts = tallyResults(results);
  printSummary(results);
  printDetails(results);
  return finalExit(counts, strict);
}

type ResultKind = "fail" | "warn" | "pass";

function classifyResult(r: CheckResult): ResultKind {
  const kinds = r.findings.map((f) => f.severity);
  if (kinds.includes("block")) return "fail";
  if (kinds.includes("warn")) return "warn";
  return "pass";
}

function tallyResults(results: CheckResult[]): { failed: number; warned: number } {
  let failed = 0;
  let warned = 0;
  for (const r of results) {
    const kind = classifyResult(r);
    if (kind === "fail") failed++;
    if (kind === "warn") warned++;
  }
  return { failed, warned };
}

function printSummary(results: CheckResult[]): void {
  const sym = {
    pass: c.green("✓"),
    fail: c.red("✗"),
    warn: c.yellow("⚠"),
  };
  for (const r of results) {
    const kind = classifyResult(r);
    const symChar = kind === "fail" ? sym.fail : kind === "warn" ? sym.warn : sym.pass;
    const line = `${symChar} ${r.name.padEnd(14)}${r.summary}`;
    if (kind === "fail") {
      process.stderr.write(line + "\n");
    } else {
      process.stdout.write(line + "\n");
    }
  }
}

function printDetails(results: CheckResult[]): void {
  for (const r of results) {
    if (r.findings.length === 0) continue;
    const isFail = classifyResult(r) === "fail";
    const out = isFail ? process.stderr : process.stdout;
    out.write(`\n${c.bold(r.name)}:\n`);
    for (const f of r.findings) {
      const lineInfo = f.line > 0 ? `:${f.line}` : "";
      out.write(`  ${c.gray(f.file + lineInfo)}\n`);
      out.write(`    ${f.message}\n`);
      if (f.evidence) {
        out.write(`    ${c.gray(f.evidence)}\n`);
      }
    }
  }
}

function finalExit(counts: { failed: number; warned: number }, strict: boolean): number {
  if (counts.failed > 0) {
    process.stderr.write(`\n${c.red(`${counts.failed} check(s) failed. Commit blocked.`)}\n`);
    return 1;
  }
  if (counts.warned > 0 && strict) {
    process.stderr.write(`\n${c.yellow(`${counts.warned} check(s) warned. Strict mode = failed.`)}\n`);
    return 1;
  }
  if (counts.warned > 0) {
    process.stdout.write(`\n${c.yellow(`${counts.warned} check(s) warned. Bypass with --strict off.`)}\n`);
  }
  return 0;
}
