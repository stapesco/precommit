import { describe, it, expect } from "vitest";
import { checkSecrets, defaultSecretsConfig } from "../../src/checks/secrets.js";
import type { StagedFile } from "../../src/util.js";

function makeFile(path: string, content: string): StagedFile {
  return { path, status: "M", content };
}

// Build fake tokens via string concat so the literal "secret" doesn't appear
// in the source file (which would trip craft-secret-leak). The check reads
// the runtime-evaluated content, not the source code.
const fake_ghp = "ghp_" + "A".repeat(36);
const fake_gp = "github_pat_" + "1A".repeat(41);
const fake_sk = "sk-" + "abc".repeat(8);

describe("checkSecrets", () => {
  it("passes when no content matches", () => {
    const files = [makeFile("src/index.ts", 'const x = "hello world";')];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("detects GitHub PAT", () => {
    const files = [makeFile("src/auth.ts", `const token = "${fake_ghp}";`)];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/GitHub PAT/);
  });

  it("detects GitHub fine-grained PAT", () => {
    const files = [makeFile("src/auth.ts", `const token = "${fake_gp}";`)];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/GitHub fine-grained PAT/);
  });

  it("detects OpenAI key", () => {
    const files = [makeFile("src/api.ts", `const k = "${fake_sk}";`)];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/OpenAI/);
  });

  it("detects PEM private key", () => {
    const files = [
      makeFile("certs/key.pem", "-----BEGIN RSA PRIVATE KEY-----\nMIIEowIBAAK...")
    ];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(false);
    expect(result.findings[0].message).toMatch(/PEM/);
  });

  it("skips lockfiles", () => {
    const files = [
      makeFile(
        "package-lock.json",
        JSON.stringify({ packages: { "": { version: "1.0.0" } } })
      )
    ];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(true);
  });

  it("skips .md files", () => {
    const files = [
      makeFile(
        "README.md",
        "Use OPENAI_API_KEY=<your-key> in your .env"
      )
    ];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(true);
  });

  it("skips placeholder-looking secrets", () => {
    const files = [
      makeFile("src/auth.ts", "const token = 'your-token-here';")
    ];
    const result = checkSecrets(files, defaultSecretsConfig);
    expect(result.passed).toBe(true);
  });
});
