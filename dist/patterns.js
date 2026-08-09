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
export const DEFAULT_PATTERNS = [
    // AWS access key
    {
        name: "AWS Access Key",
        regex: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g,
        confidence: 0.95,
    },
    // AWS secret key (often paired with `aws_secret_access_key`)
    {
        name: "AWS Secret Key",
        regex: /aws[_-]?secret[_-]?access[_-]?key["'\s:=]+([A-Za-z0-9/+=]{40})/gi,
        confidence: 0.85,
    },
    // GitHub PAT (classic)
    {
        name: "GitHub PAT",
        regex: /\bghp_[A-Za-z0-9]{36,}\b/g,
        confidence: 0.99,
    },
    // GitHub fine-grained PAT
    {
        name: "GitHub fine-grained PAT",
        regex: /\bgithub_pat_[A-Za-z0-9_]{82}\b/g,
        confidence: 0.99,
    },
    // GitHub OAuth tokens
    {
        name: "GitHub OAuth",
        regex: /\bgho_[A-Za-z0-9]{36,}\b/g,
        confidence: 0.99,
    },
    // GitHub user token
    {
        name: "GitHub User Token",
        regex: /\bghu_[A-Za-z0-9]{36,}\b/g,
        confidence: 0.99,
    },
    // GitHub server token
    {
        name: "GitHub Server Token",
        regex: /\bghs_[A-Za-z0-9]{36,}\b/g,
        confidence: 0.99,
    },
    // OpenAI API key
    {
        name: "OpenAI API Key",
        regex: /\bsk-(?:proj-)?[A-Za-z0-9]{20,}\b/g,
        confidence: 0.85,
    },
    // Anthropic API key
    {
        name: "Anthropic API Key",
        regex: /\bsk-ant-[A-Za-z0-9-]{32,}\b/g,
        confidence: 0.95,
    },
    // Stripe live keys
    {
        name: "Stripe Live Key",
        regex: /\b(?:sk|pk|rk)_live_[A-Za-z0-9]{24,}\b/g,
        confidence: 0.99,
    },
    // Google API key
    {
        name: "Google API Key",
        regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
        confidence: 0.90,
    },
    // Slack tokens
    {
        name: "Slack Token",
        regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g,
        confidence: 0.95,
    },
    // PEM private key block
    {
        name: "PEM Private Key",
        regex: /-----BEGIN (?:RSA |OPENSSH |EC |DSA |PGP )?PRIVATE KEY-----/g,
        confidence: 0.99,
    },
    // JWT (three base64url segments separated by dots)
    {
        name: "JWT",
        regex: /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g,
        confidence: 0.80,
    },
    // Generic Bearer token literal in source
    {
        name: "Bearer Token",
        regex: /Bearer\s+[A-Za-z0-9_-]{20,}/g,
        confidence: 0.70,
    },
    // Generic password / secret literal assignment
    {
        name: "Password literal",
        regex: /(?:password|passwd|pwd)["'\s]*[=:]["'\s]*[A-Za-z0-9!@#$%^&*()_+={}[\]:;<>,.?/-]{8,}/gi,
        confidence: 0.50,
    },
];
/**
 * Files that we should NOT scan for secrets.
 * (Examples: lockfile, package metadata, .md files, test fixtures.)
 */
export const SECRET_SCAN_EXCLUDE = [
    /\.lock$/,
    /\.lockb$/,
    /package-lock\.json$/,
    /yarn\.lock$/,
    /pnpm-lock\.yaml$/,
    /bun\.lockb$/,
    /Cargo\.lock$/,
    /poetry\.lock$/,
    /\.md$/,
    /\.txt$/,
    /LICENSE$/,
    /CHANGELOG/,
    /\.test\./,
    /\.spec\./,
    /__tests__\//,
    /test\//,
    /tests\//,
    /fixtures\//,
    /__snapshots__\//,
];
//# sourceMappingURL=patterns.js.map