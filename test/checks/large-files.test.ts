import { describe, it, expect } from "vitest";
import { checkLargeFiles, defaultLargeFilesConfig } from "../../src/checks/large-files.js";
import type { StagedFile } from "../../src/util.js";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

function makeFile(path: string, status = "M", content = ""): StagedFile {
  return { path, status, content };
}

describe("checkLargeFiles", () => {
  it("passes for small files", () => {
    const dir = mkdtempSync(join(tmpdir(), "spc-"));
    try {
      writeFileSync(join(dir, "small.ts"), "hello");
      const files = [makeFile("small.ts")];
      const result = checkLargeFiles(files, dir, defaultLargeFilesConfig);
      expect(result.passed).toBe(true);
      expect(result.findings).toHaveLength(0);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("warns on files > 1 MB", () => {
    const dir = mkdtempSync(join(tmpdir(), "spc-"));
    try {
      // 2 MB file
      const big = Buffer.alloc(2 * 1024 * 1024, "x");
      writeFileSync(join(dir, "big.bin"), big);
      const files = [makeFile("big.bin")];
      const result = checkLargeFiles(files, dir, defaultLargeFilesConfig);
      expect(result.passed).toBe(true);
      expect(result.findings[0].message).toMatch(/warn/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("blocks files > 10 MB", () => {
    const dir = mkdtempSync(join(tmpdir(), "spc-"));
    try {
      // 11 MB file
      const huge = Buffer.alloc(11 * 1024 * 1024, "x");
      writeFileSync(join(dir, "huge.bin"), huge);
      const files = [makeFile("huge.bin")];
      const result = checkLargeFiles(files, dir, defaultLargeFilesConfig);
      expect(result.passed).toBe(false);
      expect(result.findings[0].message).toMatch(/BLOCKED/);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("skips deleted files", () => {
    const files = [makeFile("deleted.ts", "D", "")];
    const result = checkLargeFiles(files, "/tmp", defaultLargeFilesConfig);
    expect(result.findings).toHaveLength(0);
  });
});
