/**
 * Hook installation: write a `.git/hooks/pre-commit` script that delegates
 * to this binary. Idempotent: detects existing stapes-precommit hook and
 * refuses to overwrite a non-stapes hook.
 */
export declare function installHook(repoRoot: string): number;
export declare function uninstallHook(repoRoot: string): number;
