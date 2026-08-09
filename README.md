# stapes-precommit

> A pre-commit hook only protects you if **every** commit goes through it. Most
> setups break within a week. `stapes-precommit` is one command, five checks,
> zero per-developer setup. No Python. No Docker. No config file to maintain.
> No telemetry. Works offline.

## Why

Three failure modes repeat across every team that doesn't have a working
pre-commit hook:

1. **The leaked AWS key on day three.** A new joiner runs `git commit`
   without `pre-commit install` ever being run, and a key lands on `main`.
   By the time anyone notices, it's been indexed.
2. **The 300 MB binary that broke `git clone`.** Someone committed a generated
   asset; nobody noticed until a CI runner ran out of disk.
3. **The 47 `console.log("debug", payload)` lines on a Friday afternoon.**
   Shipped to staging. Customer sees stack-trace-shaped strings in the logs.

`stapes-precommit` catches all three. The binary is one file. The install is
one command. There is no config because the five checks are the sane defaults
for 90% of repos.

## How

```bash
cd /path/to/your/repo
npx stapes-precommit --init
git commit -m "chore: add pre-commit hook"
```

That's it. The hook lives at `.git/hooks/pre-commit` inside a marker block,
so it won't fight hooks from Husky, pre-commit.com, or lefthook if you later
add them.

The next time anyone runs `git commit`:

```text
✓ secrets      0 hits
✓ large-files  0 hits
✗ console      1 hit(s)
⚠ todo         1 hit(s)
✓ filesize     0 hits

console:
  src/api/handler.ts:42
    console.log/warn in production code
      console.log("debug", req.body);

1 check(s) failed. Commit blocked.
```

For AI agents and CI scripts, `--json` gives a stable, parseable shape:

```bash
npx stapes-precommit --json | jq '.exitCode, .findings[].message'
```

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
      "message": "console.log/warn in production code",
      "evidence": "console.log(\"debug\", req.body);",
      "severity": "block"
    }
  ]
}
```

`stderr` is always empty in `--json` mode. `exitCode` is the contract: `0`
clean, `1` blocked. That's the whole protocol.

## What

The five checks:

| Check | What it catches | Severity | Default thresholds |
|---|---|---|---|
| `secrets` | AWS keys, GitHub PATs, OpenAI / Anthropic / Stripe / Google keys, JWTs, PEM blocks, generic Bearer tokens | **block** | matches at 80%+ confidence |
| `large-files` | files above the size cap | warn > 1 MB, **block** > 10 MB | `--init-config` to override |
| `console` | `console.log` / `console.warn` in `.ts` / `.js` / `.tsx` / `.jsx` | **block** (skipped in `*.test.*` and `__tests__/`) | — |
| `todo` | `TODO` / `FIXME` / `XXX` without a ticket reference (`#1234`) | warn (block with `--strict`) | — |
| `filesize` | sensitive filenames: `.env`, `*.pem`, `*.key`, `id_rsa`, `credentials.json`, `service-account*.json`, `.npmrc`, `.netrc`, `*.sqlite` | **block** | filename-based |

Flags:

```text
  --init               install the pre-commit hook in current repo
  --uninstall          remove the pre-commit hook
  --run                run all checks against staged changes (default)
  --check <name>       run a single check (secrets|large-files|console|todo|filesize)
  --list               list available checks
  --strict             treat warnings as errors
  --json               emit structured JSON on stdout (stable schema)
  --init-config <path> write a default config file (then edit before running)
  --no-color           disable ANSI color output
  --version
  --help
```

Idempotent. `npx stapes-precommit --init` run twice is a no-op.
`--uninstall` removes the hook cleanly without touching other tools.

### Agent-native

This tool is designed for AI agent runtimes and CI scripts:

- **Zero telemetry.** No network calls. No analytics. No update checks.
- **Zero config.** No files to write. No env vars to set.
- **`--json`** emits parseable output with a stable schema (`startedAt`,
  `tool`, `exitCode`, `checkCount`, `failed`, `warned`, `findings[]`).
- **Exit codes are stable.** `0` clean, `1` blocked, `2` not-in-git-repo
  or `--init` failure.
- **Idempotent install.** `--init` is safe to re-run. `--uninstall`
  removes cleanly.
- **Runs offline.** No API keys. No service to log into.

### Verify it yourself (5 lines)

The Agent-native section makes claims. Here's how to check each one in
under 30 seconds:

```bash
# 1. Zero network calls during a run
npx stapes-precommit --json >/dev/null && \
  lsof -p $$ -i 2>/dev/null | grep -E "node|npx" || \
  echo "no outgoing TCP from this shell"

# 2. No files written outside .git/hooks/
npx stapes-precommit --init && \
  find . -newer package.json -not -path "./.git/*" -not -path "./node_modules/*"

# 3. Stable exit code under --strict
npx stapes-precommit --strict --json | jq '.exitCode'
```

### Worked example — agent-style pre-commit block

```bash
#!/usr/bin/env bash
# .github/actions/pre-commit/style-check/action.yml step
npx stapes-precommit --json > precommit-report.json
code=$?
if [ "$code" -ne 0 ]; then
  jq -r '.findings[] | "::error file=\(.file)::\(.message)"' precommit-report.json
  exit 1
fi
```

### Telemetry

None. Zero network calls. The only filesystem write is
`.git/hooks/pre-commit` during `--init`.

## Compared to

| Tool | What you trade away by choosing it |
|---|---|
| **gitleaks** | More secret patterns, but Docker/Python setup, config YAML to maintain, and a separate install step |
| **pre-commit.com** | Huge ecosystem of community hooks, but Python on every dev machine and `.pre-commit-config.yaml` to maintain |
| **husky + lint-staged** | Per-file hooks, runs linters on changed files only, but lockfile dance, Node-version drift, Windows breaks |
| **lefthook** | Fast (Go), YAML config, but you maintain the YAML. `stapes-precommit` is intentionally zero-config. |
| **lint-staged alone** | Just a runner. Needs linters to be useful. |

`stapes-precommit` is for teams that want **the same five checks on every
commit, on every machine, with zero per-dev setup**. If you need custom
checks, layer `pre-commit.com` on top — they don't fight each other.

## Source

Visible at https://github.com/stapesco/precommit. Built by stapes. Read the
code. Fork it. PRs are not accepted.

See [AGENTS.md](./AGENTS.md) for machine-readable install instructions and
the stable `--json` schema.

## License

MIT