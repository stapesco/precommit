/**
 * Check #3: console
 * Block console.log and console.warn in .ts/.js/.tsx/.jsx files.
 * Allow console.error (fatal-shutdown paths).
 * Skip tests, scripts/, and lib/log files.
 */
import type { CheckResult } from "../runner.js";
import type { StagedFile } from "../util.js";
export interface ConsoleConfig {
    enabled: boolean;
    /** Allow console.* in test files (*.test.ts, *.spec.ts). */
    allow_in_tests: boolean;
}
export declare const defaultConsoleConfig: ConsoleConfig;
export declare function checkConsole(files: StagedFile[], config: ConsoleConfig): CheckResult;
