/**
 * Check #2: large-files
 * Block files > 10 MB (almost certainly accidental).
 * Warn on files > 1 MB (likely a dataset or generated file).
 */
import { statSync, existsSync } from "node:fs";
export const defaultLargeFilesConfig = {
    enabled: true,
    max_kb: 10 * 1024, // 10 MB
    warn_kb: 1024, // 1 MB
};
export function checkLargeFiles(files, repoRoot, config) {
    const findings = [];
    for (const file of files) {
        if (file.status.startsWith("D"))
            continue;
        const absPath = `${repoRoot}/${file.path}`;
        if (!existsSync(absPath))
            continue;
        const stat = statSync(absPath);
        const sizeKb = stat.size / 1024;
        if (sizeKb > config.max_kb) {
            findings.push({
                file: file.path,
                line: 0,
                message: `file is ${sizeKb.toFixed(1)} KB (limit: ${config.max_kb} KB) — BLOCKED`,
                evidence: `${stat.size} bytes`,
                severity: "block",
            });
        }
        else if (sizeKb > config.warn_kb) {
            findings.push({
                file: file.path,
                line: 0,
                message: `file is ${sizeKb.toFixed(1)} KB (warn: ${config.warn_kb} KB) — consider git-lfs`,
                evidence: `${stat.size} bytes`,
                severity: "warn",
            });
        }
    }
    const blocked = findings.filter((f) => f.message.includes("BLOCKED"));
    const warned = findings.filter((f) => !f.message.includes("BLOCKED"));
    return {
        name: "large-files",
        passed: blocked.length === 0,
        findings,
        summary: findings.length === 0
            ? "0 hits"
            : `${blocked.length} blocked, ${warned.length} warned`,
    };
}
//# sourceMappingURL=large-files.js.map