import { describe, it, expect } from "vitest";
import { assertNodeVersion, isSupportedNodeVersion } from "../src/node-check.js";

const MIN_MAJOR = 22;
const MIN_MINOR = 12;

describe("isSupportedNodeVersion", () => {
  it("rejects versions below the major floor", () => {
    expect(isSupportedNodeVersion("18.20.8")).toBe(false);
    expect(isSupportedNodeVersion("20.20.2")).toBe(false);
    expect(isSupportedNodeVersion("21.7.3")).toBe(false);
  });

  it("rejects the floor major when the minor is too low", () => {
    expect(isSupportedNodeVersion("22.0.0")).toBe(false);
    expect(isSupportedNodeVersion("22.11.9")).toBe(false);
  });

  it("accepts the floor version and anything above it", () => {
    expect(isSupportedNodeVersion("22.12.0")).toBe(true);
    expect(isSupportedNodeVersion("22.23.4")).toBe(true);
    expect(isSupportedNodeVersion("24.22.2")).toBe(true);
    expect(isSupportedNodeVersion("26.13.0")).toBe(true);
  });

  it("rejects unparseable versions instead of assuming they are safe", () => {
    expect(isSupportedNodeVersion("")).toBe(false);
    expect(isSupportedNodeVersion("not-a-version")).toBe(false);
  });
});

describe("assertNodeVersion", () => {
  it("does not exit when running on a supported Node", () => {
    if (!isSupportedNodeVersion(process.versions.node)) {
      // Skip on an unsupported node — can't test the happy path.
      return;
    }
    // No throw, no exit, no stderr.
    expect(() => assertNodeVersion()).not.toThrow();
  });

  it("matches the declared engine floor", () => {
    const floor = `${MIN_MAJOR}.${MIN_MINOR}.0`;
    expect(isSupportedNodeVersion(floor)).toBe(true);
    expect(isSupportedNodeVersion(`${MIN_MAJOR}.${MIN_MINOR - 1}.0`)).toBe(false);
  });
});
