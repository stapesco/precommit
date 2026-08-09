/**
 * Default secret-detection patterns.
 * Each pattern has a name, a regex, and a confidence score.
 * Higher confidence = more likely to be a real secret.
 *
 * Sources for these patterns:
 * - gitleaks (https://github.com/gitleaks/gitleaks/blob/master/config/gitleaks.toml)
 * - trufflehog (https://github.com/trufflesecurity/trufflehog)
 * - GitHub secret-scanning partner patterns
 *
 * False positives are accepted in v0.1.0 — better to flag than miss.
 */
export interface SecretPattern {
    name: string;
    regex: RegExp;
    confidence: number;
}
export declare const DEFAULT_PATTERNS: SecretPattern[];
/**
 * Files that we should NOT scan for secrets.
 * (Examples: lockfile, package metadata, .md files, test fixtures.)
 */
export declare const SECRET_SCAN_EXCLUDE: RegExp[];
