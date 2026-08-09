/**
 * Check #5: sensitive-files
 * Block staged files whose names match known sensitive patterns — regardless
 * of content.
 *
 * (Catches .env, *.pem, *.key, id_rsa, *.sqlite, credentials.json, etc.)
 *
 * Filename-based, distinct from the secrets check (which scans content).
 */
import type { CheckResult } from "../runner.js";
import type { StagedFile } from "../util.js";
export interface SensitiveFilesConfig {
    enabled: boolean;
}
export declare const defaultSensitiveFilesConfig: SensitiveFilesConfig;
export declare function checkSensitiveFiles(files: StagedFile[], config: SensitiveFilesConfig): CheckResult;
