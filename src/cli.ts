#!/usr/bin/env node
/**
 * stapes-precommit CLI entrypoint.
 *
 * Usage:
 *   stapes-precommit --init
 *   stapes-precommit --uninstall
 *   stapes-precommit --run [--no-color] [--strict]
 *   stapes-precommit --list
 *   stapes-precommit --check <name>
 *   stapes-precommit --version
 *   stapes-precommit --help
 */

import { Command } from "commander";
import { writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { defaultRunConfig, runAllChecks, reportAndExit, buildReport, emitJson } from "./runner.js";
import { installHook, uninstallHook } from "./hook-install.js";
import { getRepoRoot } from "./util.js";
import { assertNodeVersion } from "./node-check.js";

const VERSION = "0.1.1";

const program = new Command();

program
  .name("stapes-precommit")
  .description("Zero-config pre-commit hook with 5 sanity checks.")
  .version(VERSION);

program
  .option("--init", "install the pre-commit hook in current repo")
  .option("--uninstall", "remove the pre-commit hook")
  .option("--run", "run all checks against staged changes (default)")
  .option("--check <name>", "run a single check (secrets|large-files|console|todo|sensitive-files)")
  .option("--list", "list available checks")
  .option("--strict", "treat warnings as errors")
  .option("--init-config <path>", "write a default config file to <path>")
  .option("--json", "emit a structured JSON report on stdout (stable shape; agent-friendly)")
  .option("--no-color", "disable ANSI color output");

program.parse(process.argv);
const opts = program.opts();

async function main(): Promise<number> {
  assertNodeVersion();

  // --init-config must be handled BEFORE --init: --init returns early and
  // would otherwise swallow the config-file request.
  // --init-config
  if (opts.initConfig) {
    const path = resolve(opts.initConfig);
    const config = {
      checks: {
        secrets: { enabled: true, extra_patterns: [] },
        "large-files": { enabled: true, max_kb: 10240, warn_kb: 1024 },
        console: { enabled: true, allow_in_tests: true },
        todo: { enabled: true, strict: false },
        "sensitive-files": { enabled: true },
      },
    };
    writeFileSync(path, JSON.stringify(config, null, 2) + "\n", "utf8");
    process.stdout.write(`Wrote config to ${path}\n`);
    return 0;
  }

  // --init
  if (opts.init) {
    const repoRoot = getRepoRoot();
    if (!repoRoot) {
      process.stderr.write("error: not in a git repository\n");
      return 1;
    }
    return installHook(repoRoot);
  }

  // --uninstall
  if (opts.uninstall) {
    const repoRoot = getRepoRoot();
    if (!repoRoot) {
      process.stderr.write("error: not in a git repository\n");
      return 1;
    }
    return uninstallHook(repoRoot);
  }

  // --list
  if (opts.list) {
    process.stdout.write("Available checks:\n");
    for (const name of ["secrets", "large-files", "console", "todo", "sensitive-files"]) {
      process.stdout.write(`  ${name}\n`);
    }
    return 0;
  }

  // --check <name> (single check)
  if (opts.check) {
    const name = opts.check as string;
    if (!(name in defaultRunConfig.checks)) {
      process.stderr.write(`Unknown check: ${name}\n`);
      process.stderr.write(`Available: ${Object.keys(defaultRunConfig.checks).join(", ")}\n`);
      return 1;
    }
    // Disable all other checks, run the requested one.
    const config = { ...defaultRunConfig, strict: !!opts.strict };
    for (const k of Object.keys(config.checks)) {
      config.checks[k as keyof typeof config.checks].enabled = k === name;
    }
    const results = runAllChecks(config);
    return emit(results, config.strict, opts.json);
  }

  // --run (default)
  const config = { ...defaultRunConfig, strict: !!opts.strict };
  const results = runAllChecks(config);
  return emit(results, config.strict, opts.json);
}

/**
 * Emit results either as human-readable text (the default) or as a
 * structured JSON report (when --json is set). Same exit-code semantics
 * in both modes: 0 = clean, 1 = blocked, 2 = warn-in-strict.
 */
function emit(results: ReturnType<typeof runAllChecks>, strict: boolean, json: boolean | undefined): number {
  if (results.length === 0) {
    // Nothing to report either way — stay quiet so scripts can chain cleanly.
    return 0;
  }
  if (json) {
    const report = buildReport(results, strict);
    process.stdout.write(emitJson(report));
    return report.exitCode;
  }
  return reportAndExit(results, strict);
}

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
