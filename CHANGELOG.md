# Changelog

All notable changes to `stapes-precommit` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-11-08

### Changed (breaking)

- Minimum Node.js is now 22.12.0, up from 18.0.0. Node 18 and Node 20 both
  reached end of life. A runtime below 22.12.0 exits with code 2.
- `commander` moves from 11 to 15. Version 15 is ESM-only and needs Node
  22.12.0 or newer.

### Security

- `vitest` moves from 1 to 5. The 1.x dependency tree carried three known
  advisories: a critical prototype pollution flaw in `tinypool`
  (GHSA-5gmw-xhrv-c9v3), a high denial-of-service flaw in `source-map-js`
  (GHSA-68fv-2mgg-jv7q), and a moderate flaw in `esbuild`
  (GHSA-67mh-4wv8-2f99). The new tree audits clean.

### Added

- CI runs on every push and pull request, across Node 22, 24, and 26.
- Dependabot opens weekly update pull requests for npm and GitHub Actions.
- Repository secret scanning, push protection, and Dependabot security
  updates are enabled.
- Five tests cover the Node version boundary, including the 22.12 minor.

### Fixed

- The version string had two sources of truth, so the `--json` `tool` field
  and the `--version` flag could disagree. Both read one constant now.
- `package-lock.json` recorded version 0.1.0 while `package.json` recorded
  0.1.1. The lockfile is regenerated on every version bump now.
- `AGENTS.md` documented the `--json` `tool` field as `0.1.0` while
  `README.md` documented `0.1.1`.

## [0.1.1] - 2026-08-09

### Changed (breaking)

- Renamed check #5 from `filesize` to `sensitive-files`. The old name
  described the wrong concept (it never checked filesize — it always
  checked sensitive filenames). Any `--check filesize` invocation
  must be updated to `--check sensitive-files`. Any `--init-config`
  file referencing the old `filesize` key must be updated to
  `sensitive-files`.

### Why

The previous name was misleading. Anyone reading the source would
notice the check never inspected filesize — only filenames — and
rightly lose trust in the rest of the documentation. v0.1.0 has
zero users so the breaking change is free.

### Added

- `SECURITY.md` with a private disclosure channel (email). No bug
  bounty; no SLA. Documents the 5-business-day acknowledgement target
  and 30-day fix target.
- `console` check no longer flags `console.log(...)` patterns inside
  string literals, template literals, or line comments. Catches
  error-message builders, JSDoc examples, and tutorial snippets that
  would otherwise produce false positives.
- `console` check now detects `console?.log(...)` and `console?.warn(...)`
  (optional chaining). Previously missed.
- `todo` check now recognises `// TODO @user: ...` (GitHub-style
  attribution) as a valid ticket reference. Previously flagged as
  missing-ticket.
- 10 new tests covering the four detection improvements above.

## [0.1.0] - 2026-08-09

### Added

- Five pre-commit checks out of the box: `secrets`, `large-files`, `console`,
  `todo`, `sensitive-files` (filenames matching `.env`, `*.pem`, `id_rsa`,
  `credentials.json`, `service-account*.json`, `.npmrc`, `.netrc`,
  `*.sqlite`, etc.).
- `npx stapes-precommit --init` — idempotent install. `--uninstall` removes
  cleanly.
- Stable `--json` output mode for AI agents and CI. Schema:
  `{startedAt, tool, exitCode, checkCount, failed, warned, findings[]}`.
  Stderr is always empty in `--json` mode. See `AGENTS.md` for the contract.
- `AGENTS.md` at the repo root — machine-readable install instructions,
  when-to-use / when-NOT-to-use, and the `--json` schema.
- 33 unit tests covering all five checks and the install/uninstall flow.
- Strict TypeScript, ESM, Node 18+. Zero runtime dependencies except
  `commander`.

### Notes

- Source-available under MIT. Issues disabled. Branch protection with
  `require_last_push_approval`. PRs are not accepted.
- `.env`, `*.pem`, `id_rsa`, `credentials.json`, `service-account*.json`,
  `.npmrc`, `.netrc`, and other sensitive filenames are blocked at the
  filename level by the `sensitive-files` check.
- Lockfiles, `.md`, and `.txt` files are excluded from secret scanning by
  design (high false-positive rate, low signal).
