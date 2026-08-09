import { describe, it, expect } from "vitest";
import { checkTodo, defaultTodoConfig } from "../../src/checks/todo.js";
import type { StagedFile } from "../../src/util.js";

function makeFile(path: string, content: string): StagedFile {
  return { path, status: "M", content };
}

describe("checkTodo", () => {
  it("passes when no TODOs", () => {
    const files = [makeFile("src/index.ts", "const x = 1;")];
    const result = checkTodo(files, "/tmp", defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("warns on TODO without ticket", () => {
    const files = [
      makeFile("src/api.ts", "// TODO: refactor this\nconst x = 1;"),
    ];
    const result = checkTodo(files, "/tmp", defaultTodoConfig);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].message).toMatch(/TODO/);
  });

  it("skips TODO with ticket reference", () => {
    const files = [
      makeFile("src/api.ts", "// TODO(#42): refactor this\nconst x = 1;"),
    ];
    const result = checkTodo(files, "/tmp", defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("skips TODO with URL", () => {
    const files = [
      makeFile("src/api.ts", "// TODO https://github.com/foo/bar/issues/1\nconst x = 1;"),
    ];
    const result = checkTodo(files, "/tmp", defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("detects FIXME and XXX", () => {
    const files = [
      makeFile("src/a.ts", "// FIXME: handle null\n"),
      makeFile("src/b.ts", "// XXX: hack\n"),
    ];
    const result = checkTodo(files, "/tmp", defaultTodoConfig);
    expect(result.findings).toHaveLength(2);
  });

  it("strict mode fails on warnings", () => {
    const files = [
      makeFile("src/a.ts", "// TODO: refactor\n"),
    ];
    const result = checkTodo(files, "/tmp", { ...defaultTodoConfig, strict: true });
    expect(result.passed).toBe(false);
  });
});
