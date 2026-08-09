import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, statSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { installHook, uninstallHook } from "../src/hook-install.js";

let work: string;
let hooksDir: string;
let hookPath: string;

beforeEach(() => {
  work = mkdtempSync(join(tmpdir(), "stapes-hook-"));
  execSync("git init -q", { cwd: work });
  hooksDir = join(work, ".git", "hooks");
  hookPath = join(hooksDir, "pre-commit");
});

afterEach(() => {
  rmSync(work, { recursive: true, force: true });
});

describe("installHook", () => {
  it("installs a fresh hook and marks it executable", () => {
    const code = installHook(work);
    expect(code).toBe(0);
    expect(existsSync(hookPath)).toBe(true);
    const mode = statSync(hookPath).mode & 0o777;
    expect(mode).toBe(0o755);
    const content = readFileSync(hookPath, "utf8");
    expect(content).toContain("# >>> stapes-precommit >>>");
    expect(content).toContain("# <<< stapes-precommit <<<");
    expect(content).toContain("npx --yes stapes-precommit --run");
  });

  it("is idempotent: re-install does not duplicate the block", () => {
    installHook(work);
    installHook(work);
    const content = readFileSync(hookPath, "utf8");
    // The marker pair should appear exactly once.
    expect(content.split("# >>> stapes-precommit >>>").length - 1).toBe(1);
    expect(content.split("# <<< stapes-precommit <<<").length - 1).toBe(1);
  });

  it("appends to an existing hook that is not ours", () => {
    writeFileSync(hookPath, "#!/bin/sh\necho 'custom hook'\n", { mode: 0o755 });
    const code = installHook(work);
    expect(code).toBe(0);
    const content = readFileSync(hookPath, "utf8");
    expect(content).toContain("custom hook");
    expect(content).toContain("# >>> stapes-precommit >>>");
    // chmod 0o755 enforced even though file pre-existed.
    const mode = statSync(hookPath).mode & 0o777;
    expect(mode).toBe(0o755);
  });

  it("enforces chmod 0o755 even if the existing file is non-executable", () => {
    // Create a 0o644 hook that is NOT ours.
    writeFileSync(hookPath, "#!/bin/sh\necho custom\n", { mode: 0o644 });
    installHook(work);
    const mode = statSync(hookPath).mode & 0o777;
    // The chmod call must run after writeFileSync.
    expect(mode).toBe(0o755);
  });

  it("returns 1 when not in a git repository", () => {
    const fake = mkdtempSync(join(tmpdir(), "stapes-nogit-"));
    try {
      const code = installHook(fake);
      expect(code).toBe(1);
    } finally {
      rmSync(fake, { recursive: true, force: true });
    }
  });
});

describe("uninstallHook", () => {
  it("removes our block and keeps the file executable", () => {
    installHook(work);
    const code = uninstallHook(work);
    expect(code).toBe(0);
    const content = readFileSync(hookPath, "utf8");
    expect(content).not.toContain("# >>> stapes-precommit >>>");
    const mode = statSync(hookPath).mode & 0o777;
    expect(mode).toBe(0o755);
  });

  it("is a no-op when no hook exists", () => {
    const code = uninstallHook(work);
    expect(code).toBe(0);
  });

  it("refuses to remove a hook that is not ours", () => {
    writeFileSync(hookPath, "#!/bin/sh\n# some other tool\nexit 0\n", { mode: 0o755 });
    const code = uninstallHook(work);
    expect(code).toBe(1);
    // File untouched.
    expect(readFileSync(hookPath, "utf8")).toContain("some other tool");
  });

  it("is a no-op (exit 0) when not in a git repository", () => {
    const fake = mkdtempSync(join(tmpdir(), "stapes-nogit-"));
    try {
      const code = uninstallHook(fake);
      // Idempotent: there's nothing to uninstall, so 0 is correct.
      expect(code).toBe(0);
    } finally {
      rmSync(fake, { recursive: true, force: true });
    }
  });
});