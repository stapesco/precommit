/**
 * Hook installation: write a `.git/hooks/pre-commit` script that delegates
 * to this binary. Idempotent: detects existing stapes-precommit hook and
 * refuses to overwrite a non-stapes hook.
 */

import { existsSync, readFileSync, writeFileSync, chmodSync } from "node:fs";
import { resolve } from "node:path";
import { c } from "./util.js";

const HOOK_MARKER = "# >>> stapes-precommit >>>";
const HOOK_MARKER_END = "# <<< stapes-precommit <<<";

/**
 * Write the hook script and ensure it's executable. `writeFileSync` with
 * `{ mode: 0o755 }` only honours the mode on file creation — when the file
 * already exists (re-install, append-into-existing), we have to chmod
 * afterwards or git will fail to invoke a non-executable hook.
 */
function writeHook(path: string, content: string): void {
  writeFileSync(path, content, { mode: 0o755 });
  chmodSync(path, 0o755);
}

export function installHook(repoRoot: string): number {
  const hookPath = resolve(repoRoot, ".git/hooks/pre-commit");
  const gitHooksDir = resolve(repoRoot, ".git/hooks");

  if (!existsSync(gitHooksDir)) {
    process.stderr.write(`${c.red("error:")} ${gitHooksDir} does not exist. Run this in a git repo.\n`);
    return 1;
  }

  // Existing hook? Check for our marker.
  if (existsSync(hookPath)) {
    const existing = readFileSync(hookPath, "utf8");
    if (existing.includes(HOOK_MARKER)) {
      // Idempotent: re-write our block, leave the file executable.
      writeHook(hookPath, existing);
      process.stdout.write("stapes-precommit hook already installed. Reinstalled.\n");
      return 0;
    }
    // Existing hook is not ours. Append our marker block, then chmod.
    const appended = `${existing.trimEnd()}\n\n${hookContent()}\n`;
    writeHook(hookPath, appended);
    process.stdout.write(
      `Existing hook preserved. stapes-precommit appended to ${hookPath}\n`
    );
    return 0;
  }

  writeHook(hookPath, hookContent());
  process.stdout.write(`Installed ${hookPath}\n`);
  return 0;
}

export function uninstallHook(repoRoot: string): number {
  const hookPath = resolve(repoRoot, ".git/hooks/pre-commit");
  if (!existsSync(hookPath)) {
    process.stdout.write("No hook to uninstall.\n");
    return 0;
  }

  const existing = readFileSync(hookPath, "utf8");
  if (!existing.includes(HOOK_MARKER)) {
    process.stderr.write(
      `${c.red("error:")} existing hook is not from stapes-precommit. Skipping.\n`
    );
    return 1;
  }

  // Strip our block.
  const stripped = stripBlock(existing, HOOK_MARKER, HOOK_MARKER_END);
  if (stripped.trim().length === 0) {
    // Hook is now empty — leave a no-op shim so git doesn't choke, and keep
    // it executable.
    writeHook(hookPath, "#!/bin/sh\nexit 0\n");
    process.stdout.write("stapes-precommit block removed. Hook replaced with no-op.\n");
  } else {
    writeHook(hookPath, stripped);
    process.stdout.write("stapes-precommit block removed.\n");
  }
  return 0;
}

function hookContent(): string {
  return `#!/bin/sh
${HOOK_MARKER}
# Auto-installed by stapes-precommit. Do not edit this block.
# To remove: run \`npx stapes-precommit --uninstall\` or delete this file.
exec npx --yes stapes-precommit --run "\$@"
${HOOK_MARKER_END}
`;
}

function stripBlock(content: string, start: string, end: string): string {
  const startIdx = content.indexOf(start);
  if (startIdx === -1) return content;
  const endIdx = content.indexOf(end, startIdx);
  if (endIdx === -1) return content;
  const before = content.slice(0, startIdx);
  const after = content.slice(endIdx + end.length);
  return before + after;
}
