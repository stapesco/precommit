import { describe, it, expect } from "vitest";
import { checkConsole, defaultConsoleConfig } from "../../src/checks/console.js";
import type { StagedFile } from "../../src/util.js";

function makeFile(path: string, content: string): StagedFile {
  return { path, status: "M", content };
}

describe("checkConsole", () => {
  it("passes when no console.log present", () => {
    const files = [makeFile("src/index.ts", "const x = 1;")];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });

  it("detects console.log in production code", () => {
    const files = [
      makeFile("src/index.ts", 'console.log("hello");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/console\.log\/warn/);
  });

  it("detects console.warn", () => {
    const files = [
      makeFile("src/api.ts", 'console.warn("deprecated");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(false);
  });

  it("allows console.error", () => {
    const files = [
      makeFile("src/index.ts", 'console.error("fatal");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });

  it("skips test files", () => {
    const files = [
      makeFile("src/index.test.ts", 'console.log("debug");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });

  it("skips scripts/", () => {
    const files = [
      makeFile("scripts/build.ts", 'console.log("building");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });

  it("skips non-JS files", () => {
    const files = [
      makeFile("README.md", 'console.log("hello");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });
});
