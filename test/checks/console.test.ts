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

  it("skips nested scripts/ directory", () => {
    const files = [
      makeFile("packages/foo/scripts/build.ts", 'console.log("building");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });

  it("does NOT skip files with 'scripts' as a substring (false-negative fix)", () => {
    // my-scripts/, scripts-utils/, etc. are NOT scripts/ dirs.
    const files = [
      makeFile("src/my-scripts/logger.ts", 'console.log("debug");'),
      makeFile("src/scripts-utils/helper.ts", 'console.log("debug");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(false);
    expect(result.findings.length).toBe(2);
  });

  describe("string-literal false positives", () => {
    it("does NOT flag console.log inside a double-quoted string", () => {
      const files = [makeFile("src/logger.ts", 'const msg = "console.log(\\"hi\\")";')];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(true);
    });

    it("does NOT flag console.log inside a single-quoted string", () => {
      const files = [makeFile("src/logger.ts", "const msg = 'console.log(\\\"hi\\\")';")];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(true);
    });

    it("does NOT flag console.log inside a template literal", () => {
      const files = [makeFile("src/logger.ts", "const doc = `console.log('debug')`;")];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(true);
    });

    it("does NOT flag console.log in a line comment", () => {
      const files = [makeFile("src/logger.ts", "// console.log('debug');")];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(true);
    });

    it("STILL flags a real call on the same line as a string", () => {
      const files = [
        makeFile("src/logger.ts", 'const msg = "log"; console.log(msg);'),
      ];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(false);
      expect(result.findings.length).toBe(1);
    });
  });

  describe("expanded detection", () => {
    it("detects console.log with optional chaining (console?.log)", () => {
      const files = [makeFile("src/logger.ts", "console?.log('debug');")];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(false);
    });

    it("detects console.warn with optional chaining", () => {
      const files = [makeFile("src/logger.ts", "console?.warn('warn');")];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(false);
    });

    it("does NOT flag 'myconsole.log' (subword, not real console)", () => {
      const files = [makeFile("src/util.ts", "myconsole.log('x');")];
      const result = checkConsole(files, defaultConsoleConfig);
      expect(result.passed).toBe(true);
    });
  });

  it("skips non-JS files", () => {
    const files = [
      makeFile("README.md", 'console.log("hello");'),
    ];
    const result = checkConsole(files, defaultConsoleConfig);
    expect(result.passed).toBe(true);
  });
});
