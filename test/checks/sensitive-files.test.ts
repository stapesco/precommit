import { describe, it, expect } from "vitest";
import { checkSensitiveFiles, defaultSensitiveFilesConfig } from "../../src/checks/sensitive-files.js";
import type { StagedFile } from "../../src/util.js";

function makeFile(path: string, content = ""): StagedFile {
  return { path, status: "M", content };
}

describe("checkSensitiveFiles", () => {
  it("passes for normal files", () => {
    const files = [makeFile("src/index.ts"), makeFile("README.md")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(true);
  });

  it("blocks .env", () => {
    const files = [makeFile(".env", "API_KEY=secret")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/\.env/);
  });

  it("blocks .env.production", () => {
    const files = [makeFile(".env.production", "API_KEY=secret")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(false);
  });

  it("blocks .pem", () => {
    const files = [makeFile("certs/server.pem", "...")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(false);
  });

  it("blocks SSH private keys", () => {
    const files = [makeFile("home/.ssh/id_rsa", "...")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(false);
  });

  it("blocks credentials.json", () => {
    const files = [makeFile("creds/credentials.json", "{}")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(false);
  });

  it("uses 'sensitive-files' as the check name", () => {
    const files = [makeFile(".env")];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.name).toBe("sensitive-files");
  });

  it("matches case-insensitively (.ENV, .Env.production, ID_RSA, .NPMRC)", () => {
    const files = [
      makeFile(".ENV"),
      makeFile(".Env.production"),
      makeFile("home/ID_RSA"),
      makeFile(".NPMRC"),
      makeFile("creds/CREDENTIALS.JSON"),
    ];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(false);
    expect(result.findings.length).toBe(5);
  });

  it("does not match legitimate code with 'env' or 'npmrc' in the name", () => {
    const files = [
      makeFile("src/environment.ts"),
      makeFile("src/envConfig.ts"),
      makeFile("src/npmrc.test.ts"),
    ];
    const result = checkSensitiveFiles(files, defaultSensitiveFilesConfig);
    expect(result.passed).toBe(true);
  });
});