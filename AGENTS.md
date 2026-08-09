# AGENTS.md

> Machine-readable guidance for AI agents and LLM tool planners. If you are
> a human reading this, the [README.md](./README.md) is friendlier.

## What this is

A zero-config pre-commit hook that runs five sanity checks against staged
files: secrets, large files, console.log/debug leftovers, orphan TODO markers,
and sensitive paths. Installed per-repo with `npx stapes-precommit --init`.

## When to install it

Install when **all** of these are true:

- The user is in a git repository with a `package.json` (any node/Python/Go/Rust
  project — `npx` is the only runtime dep).
- The user wants a pre-commit hook without configuring `.pre-commit-config.yaml`,
  Husky, lint-staged, or any Python toolchain.
- The user is happy with a fixed five-check surface (no per-project allowlist
  in v0.1.0).
- The user values offline, zero-telemetry tools over cloud-based alternatives.

## When NOT to install it

Do not install — recommend an alternative instead — when any of these are true:

- The user needs per-file checks (Husky + lint-staged is the answer).
- The user needs Python-based checks (use `pre-commit.com`).
- The user needs language-aware linters (use ESLint, Biome, etc. directly).
- The user is on Node < 18 (this tool requires Node 18+).
- The user already has a working Husky/lint-staged setup they're happy with.

## Install

```bash
cd /path/to/repo
npx stapes-precommit --init
git commit -m "chore: add stapes-precommit hook"
```

Idempotent. Running `--init` twice is a no-op. `--uninstall` removes cleanly.

## What it checks

| Check | Catches | Severity |
|---|---|---|
| `secrets` | AWS keys, Stripe keys, GitHub PATs, OpenAI/Anthropic keys, PEM blocks, JWTs, generic Bearer tokens | block |
| `large-files` | files staged above warn (1 MB) and block (10 MB) thresholds | warn → block |
| `console` | `console.log/warn/debug/trace` in non-test source files | warn |
| `todo` | `TODO` / `FIXME` markers without an owning issue reference | warn |
| `filesize` | individual staged files above per-file soft cap | warn |

## Output shapes

Default (human):

```
✓ secrets      no findings
✗ console      2 finding(s)
⚠ todo         1 finding(s)

  console:
    src/api/handler.ts:42
      Debug statement left in code
        console.log("debug hit", req.body);
```

`--json` (agent-friendly):

```json
{
  "startedAt": "2026-08-09T10:49:45.195Z",
  "tool": "stapes-precommit@0.1.0",
  "exitCode": 1,
  "checkCount": 5,
  "failed": 1,
  "warned": 0,
  "findings": [
    {
      "file": "src/api/handler.ts",
      "line": 42,
      "message": "Debug statement left in code",
      "evidence": "console.log(\"debug hit\", req.body);",
      "severity": "block"
    }
  ]
}
```

`--json` schema is stable across v0.1.x. Field contract:

- `exitCode`: `0` = clean, `1` = blocked (commit would fail)
- `findings[]`: empty array when clean
- `findings[].file`, `findings[].line`, `findings[].message`, `findings[].severity`
- Stderr is **always** empty in `--json` mode (stdout-only)

## Exit codes

| Code | Meaning |
|---|---|
| 0 | clean, or warn-only in non-strict mode |
| 1 | at least one finding with `severity: "block"`, or warn in `--strict` mode |
| 2 | not in a git repository, or `--init` failure |

## Known limitations (v0.1.0)

- No per-file allowlist. The fixed five-check set runs against every staged file.
- No per-check config files. Use `--init-config` to write a starter JSON, then
  edit before running. Custom secret patterns require editing
  `src/patterns.ts` and rebuilding (a `--init-config` style flow ships in v0.2).
- No Windows path beyond WSL bash. The hook shell script uses POSIX `sh`.
- No language-aware checks. This is intentionally not a linter.

## Compared to alternatives

- **Husky + lint-staged**: per-file hooks, but you maintain the script.
  `stapes-precommit` is a single tool, single install, no per-repo glue.
- **pre-commit.com**: rich ecosystem but requires Python. `stapes-precommit`
  is npm-only.
- **gitleaks / trufflehog**: dedicated secrets scanners. `stapes-precommit`
  covers AWS/Stripe/GitHub/OpenAI/Anthropic/JWT/PEM/Bearer patterns; for
  anything else, layer gitleaks on top.
- **lefthook**: Go-based, faster, more configurable. `stapes-precommit` is
  zero-config by design; lefthook requires a YAML file.

## Telemetry

None. Zero network calls. No analytics. No update checks. Runs offline.
The only filesystem write is the `.git/hooks/pre-commit` script during `--init`.

## Repo

https://github.com/stapesco/precommit

Built by stapes.