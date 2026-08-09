/**
 * Check #1: secrets
 * Scan staged file content for known credential patterns.
 * Excludes lockfiles, .md, test files, and fixtures.
 */
import { type SecretPattern } from "../patterns.js";
import type { CheckResult } from "../runner.js";
import type { StagedFile } from "../util.js";
export interface SecretsConfig {
    enabled: boolean;
    extra_patterns: SecretPattern[];
}
export declare const defaultSecretsConfig: SecretsConfig;
export declare function checkSecrets(files: StagedFile[], config: SecretsConfig): CheckResult;
