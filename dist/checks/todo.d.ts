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
import type { CheckResult } from "../runner.js";
import type { StagedFile } from "../util.js";
export interface TodoConfig {
    enabled: boolean;
    /** If true, also block (not just warn). */
    strict: boolean;
}
export declare const defaultTodoConfig: TodoConfig;
export declare function checkTodo(files: StagedFile[], config: TodoConfig): CheckResult;
