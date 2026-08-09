# Changelog

All notable changes to `stapes-precommit` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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