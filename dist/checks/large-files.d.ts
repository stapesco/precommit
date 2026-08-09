/**
 * Check #2: large-files
 * Block files > 10 MB (almost certainly accidental).
 * Warn on files > 1 MB (likely a dataset or generated file).
 */
import type { CheckResult } from "../runner.js";
import type { StagedFile } from "../util.js";
export interface LargeFilesConfig {
    enabled: boolean;
    /** Files larger than this are blocked. */
    max_kb: number;
    /** Files larger than this are warned. */
    warn_kb: number;
}
export declare const defaultLargeFilesConfig: LargeFilesConfig;
export declare function checkLargeFiles(files: StagedFile[], repoRoot: string, config: LargeFilesConfig): CheckResult;
