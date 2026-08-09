/**
 * Check #3: console
 * Block console.log and console.warn in .ts/.js/.tsx/.jsx files.
 * Allow console.error (fatal-shutdown paths).
 * Skip tests, scripts/, and lib/log files.
 */
export const defaultConsoleConfig = {
    enabled: true,
    allow_in_tests: true,
};
const TARGET_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
/**
 * Path-segment matcher: returns true if `seg` is a directory segment of `path`.
 */
function hasPathSegment(path, seg) {
    const parts = path.split("/");
    return parts.includes(seg);
}
/**
 * Detect a `console.log(...)` or `console.warn(...)` invocation on a single
 * line, but only if it's actually being called — not embedded inside a
 * string, template literal, or comment.
 *
 * The heuristic: strip line-comment content (`//...` and `#!...` to EOL),
 * then look for the call *outside* any quoted region (single, double, or
 * backtick). This is a token-by-token walk, not a full parser — sufficient
 * to catch the common false positives (error-message builders, JSDoc
 * examples, template literals documenting the API) without a parser dep.
 */
function isRealConsoleCall(line) {
    // Skip comment lines outright.
    const trimmed = line.trimStart();
    if (trimmed.startsWith("//") ||
        trimmed.startsWith("#") ||
        trimmed.startsWith("*") ||
        trimmed.startsWith("/*")) {
        return false;
    }
    // Walk the line, tracking whether we're inside a quoted region.
    let i = 0;
    while (i < line.length) {
        const ch = line[i];
        // Skip escapes within strings.
        if (ch === "\\") {
            i += 2;
            continue;
        }
        if (ch === "'" || ch === '"' || ch === "`") {
            const quote = ch;
            i++;
            while (i < line.length && line[i] !== quote) {
                if (line[i] === "\\" && i + 1 < line.length)
                    i += 2;
                else
                    i++;
            }
            i++; // skip closing quote
            continue;
        }
        // Look for "console" at this position (with optional-chaining support).
        if ((ch === "c" || ch === "C") && line.slice(i, i + 7).toLowerCase() === "console") {
            let after = i + 7;
            // Skip optional chaining: console?.log()
            if (line.slice(after, after + 2) === "?.")
                after += 2;
            else if (line[after] === ".")
                after += 1;
            else {
                i++;
                continue;
            }
            // Must be a bareword boundary on the *left* — preceded by start,
            // whitespace, operator, or punctuation (not e.g. "myconsole.").
            if (!(i === 0 || /[\s(\[{}=;,:!?+\-*/%<>^|&~]/.test(line[i - 1]))) {
                i++;
                continue;
            }
            const m = line.slice(after).match(/^(log|warn)\s*\(/);
            if (m)
                return true;
        }
        i++;
    }
    return false;
}
export function checkConsole(files, config) {
    const findings = [];
    for (const file of files) {
        if (!file.content)
            continue;
        // Skip tests if config allows.
        if (config.allow_in_tests && isTestFile(file.path))
            continue;
        // Skip scripts/ as a directory segment (not a substring like
        // "my-scripts" or "scripts-utils" — that was a false-negative bug).
        if (hasPathSegment(file.path, "scripts"))
            continue;
        // Only scan JS/TS extensions.
        if (!TARGET_EXTS.some((ext) => file.path.endsWith(ext)))
            continue;
        const lines = file.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (isRealConsoleCall(line)) {
                findings.push({
                    file: file.path,
                    line: i + 1,
                    message: `console.log/warn in production code`,
                    evidence: line.trim().slice(0, 80),
                    severity: "block",
                });
            }
        }
    }
    return {
        name: "console",
        passed: findings.length === 0,
        findings,
        summary: findings.length === 0 ? "0 hits" : `${findings.length} hit(s)`,
    };
}
function isTestFile(path) {
    return (/\.test\.[jt]sx?$/.test(path) ||
        /\.spec\.[jt]sx?$/.test(path) ||
        /__tests__\//.test(path) ||
        /\/tests?\//.test(path));
}
//# sourceMappingURL=console.js.map