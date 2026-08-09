import { describe, it, expect } from "vitest";
import { checkFilesize, defaultFilesizeConfig } from "../../src/checks/filesize.js";
import type { StagedFile } from "../../src/util.js";

function makeFile(path: string, content = ""): StagedFile {
  return { path, status: "M", content };
}

describe("checkFilesize", () => {
  it("passes for normal files", () => {
    const files = [makeFile("src/index.ts"), makeFile("README.md")];
    const result = checkFilesize(files, defaultFilesizeConfig);
    expect(result.passed).toBe(true);
  });

  it("blocks .env", () => {
    const files = [makeFile(".env", "API_KEY=secret")];
    const result = checkFilesize(files, defaultFilesizeConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/\.env/);
  });

  it("blocks .env.production", () => {
    const files = [makeFile(".env.production", "API_KEY=secret")];
    const result = checkFilesize(files, defaultFilesizeConfig);
    expect(result.passed).toBe(false);
  });

  it("blocks .pem", () => {
    const files = [makeFile("certs/server.pem", "...")];
    const result = checkFilesize(files, defaultFilesizeConfig);
    expect(result.passed).toBe(false);
  });

  it("blocks SSH private keys", () => {
    const files = [makeFile("home/.ssh/id_rsa", "...")];
    const result = checkFilesize(files, defaultFilesizeConfig);
    expect(result.passed).toBe(false);
  });

  it("blocks credentials.json", () => {
    const files = [makeFile("creds/credentials.json", "{}")];
    const result = checkFilesize(files, defaultFilesizeConfig);
    expect(result.passed).toBe(false);
  });
});
