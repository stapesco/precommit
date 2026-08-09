import { describe, it, expect } from "vitest";
import { assertNodeVersion } from "../src/node-check.js";

describe("assertNodeVersion", () => {
  it("does not exit when running on Node >= 18", () => {
    const realVersion = process.versions.node;
    const major = parseInt(realVersion.split(".")[0] ?? "0", 10);
    if (major < 18) {
      // Skip on an old node — can't test the happy path.
      return;
    }
    // No throw, no exit, no stderr.
    expect(() => assertNodeVersion()).not.toThrow();
  });
});