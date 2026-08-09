import { describe, it, expect } from "vitest";
import { checkTodo, defaultTodoConfig } from "../../src/checks/todo.js";
import type { StagedFile } from "../../src/util.js";

function makeFile(path: string, content: string): StagedFile {
  return { path, status: "M", content };
}

describe("checkTodo", () => {
  it("passes when no TODOs", () => {
    const files = [makeFile("src/index.ts", "const x = 1;")];
    const result = checkTodo(files, defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("warns on TODO without ticket", () => {
    const files = [
      makeFile("src/api.ts", "// TODO: refactor this\nconst x = 1;"),
    ];
    const result = checkTodo(files, defaultTodoConfig);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0].message).toMatch(/TODO/);
  });

  it("skips TODO with ticket reference", () => {
    const files = [
      makeFile("src/api.ts", "// TODO(#42): refactor this\nconst x = 1;"),
    ];
    const result = checkTodo(files, defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("skips TODO with URL", () => {
    const files = [
      makeFile("src/api.ts", "// TODO https://github.com/foo/bar/issues/1\nconst x = 1;"),
    ];
    const result = checkTodo(files, defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("detects FIXME and XXX", () => {
    const files = [
      makeFile("src/a.ts", "// FIXME: handle null\n"),
      makeFile("src/b.ts", "// XXX: hack\n"),
    ];
    const result = checkTodo(files, defaultTodoConfig);
    expect(result.findings).toHaveLength(2);
  });

  it("strict mode fails on warnings", () => {
    const files = [
      makeFile("src/a.ts", "// TODO: refactor\n"),
    ];
    const result = checkTodo(files, { ...defaultTodoConfig, strict: true });
    expect(result.passed).toBe(false);
  });

  it("skips TODO with GitHub-style @user attribution", () => {
    const files = [
      makeFile("src/api.ts", "// TODO @leon: refactor this\n"),
      makeFile("src/api.ts", "// FIXME @alice: handle the edge case\n"),
    ];
    const result = checkTodo(files, defaultTodoConfig);
    expect(result.findings).toHaveLength(0);
  });

  it("does not skip TODO with @ inside a word (false-positive guard)", () => {
    // "@example" as part of an email-like token isn't an attribution.
    // Our regex is /^\s*@\w+/ so it would still match — but the prefix
    // must be at the start of the message. Test that "@user" mid-line
    // still flags as no-ticket.
    const files = [
      makeFile("src/api.ts", "// TODO: see docs@example.com for details\n"),
    ];
    const result = checkTodo(files, defaultTodoConfig);
    // The @example.com is in the middle, not at the start of the message
    // after TODO, so it shouldn't be treated as a ticket.
    expect(result.findings.length).toBe(1);
  });
});
