/**
 * Check #4: todo
 * Warn on unmatched TODO/FIXME/XXX markers in staged production code.
 * Skips .md files entirely (TODO is normal in docs).
 * "Unmatched" = a TODO/FIXME/XXX that's NOT followed by an issue/ticket reference.
 *
 * Matches:
 *   TODO: refactor this         (warn — no ticket)
 *   FIXME: handle null          (warn — no ticket)
 *   XXX: hack                    (warn — no ticket)
 *   TODO(#42): fix it            (skipped — has ticket)
 *   TODO(#123):                 (skipped — has ticket)
 *   TODO https://...             (skipped — has URL)
 */
export const defaultTodoConfig = {
    enabled: true,
    strict: false,
};
const PRODUCTION_EXTS = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb", ".sh"];
export function checkTodo(files, config) {
    const findings = [];
    for (const file of files) {
        if (!file.content)
            continue;
        if (!PRODUCTION_EXTS.some((ext) => file.path.endsWith(ext)))
            continue;
        const lines = file.content.split("\n");
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Match TODO/FIXME/XXX at the start of a comment (allow leading whitespace).
            const m = line.match(/^\s*(?:\/\/|#|--|;|\*)?\s*(TODO|FIXME|XXX)\b\s*:?\s*(.*)$/);
            if (!m)
                continue;
            const marker = m[1];
            const rest = m[2];
            // Skip if it has a ticket reference. Recognised forms:
            //   #NNN              GitHub-style issue
            //   (#NNN)            same, parenthesised
            //   https://...       a URL (issue, doc, slack thread)
            //   (PROJ-123)        Jira-style key
            //   [PROJ-123]        bracketed Jira
            //   @user             GitHub-style attribution (treat as assigned)
            const hasTicket = /^\s*#\d+/.test(rest) ||
                /^\s*\(#?\d+\)/.test(rest) ||
                /^\s*https?:\/\//.test(rest) ||
                /^\s*\([A-Z]+-\d+\)/.test(rest) ||
                /^\s*\[[A-Z]+-\d+\]/.test(rest) ||
                /^\s*@\w+/.test(rest);
            if (hasTicket)
                continue;
            findings.push({ file: file.path,
                line: i + 1,
                message: `${marker} without ticket reference (add #NNN or URL)`,
                evidence: line.trim().slice(0, 80), severity: "warn" });
        }
    }
    return {
        name: "todo",
        passed: config.strict ? findings.length === 0 : true,
        findings,
        summary: findings.length === 0 ? "0 hits" : `${findings.length} hit(s)`,
    };
}
//# sourceMappingURL=todo.js.map