# stapes-precommit

> A pre-commit hook only protects you if **every** commit goes through it. Most setups break within a week. `stapes-precommit` is the answer: one command, the same five checks on every commit. No Python. No Docker. No config to maintain.

## Why

Most pre-commit setups break within a week. Someone forgets the hook on a clone. A new joiner skips the install on day one and ships a leaked API key by day three.

This tool is intentionally minimal. The binary is one file. The checks are five. The install is one command. Nothing to maintain because nothing to configure.

The checks that ship in v0.1.0:

| Check | What | Default |
|-------|------|---------|
| `secrets` | AWS, GitHub PATs, OpenAI/Anthropic, Stripe, JWT, PEM, generic passwords | block |
| `large-files` | Files over 10 MB | block / warn over 1 MB |
| `console` | `console.log` and `console.warn` in `.ts` / `.js` code | block |
| `todo` | `TODO` / `FIXME` / `XXX` without a ticket reference | warn |
| `filesize` | `.env`, `*.pem`, `id_rsa`, `credentials.json` | block |

## How

```bash
npx stapes-precommit --init
```

Then `git commit` runs the checks automatically. Every contributor, every clone, every commit.

```text
✓ secrets      0 hits
✓ large-files  0 hits
✗ console      1 hit(s)
⚠ todo         0 hits
✓ filesize     0 hits

console:
  src/index.ts:14
    console.log/warn in production code
    console.log("debug", payload);

1 check(s) failed. Commit blocked.
```

The hook installs to `.git/hooks/pre-commit` inside a marker block. It will not fight hooks from other tools.

## What

```bash
stapes-precommit [options]

  --init               install the pre-commit hook in current repo
  --uninstall          remove the pre-commit hook
  --run                run all checks against staged changes (default)
  --check <name>       run a single check (secrets|large-files|console|todo|filesize)
  --list               list available checks
  --strict             treat warnings as errors
  --no-color           disable ANSI color output
  --init-config <path> write a default config file
  --version
  --help
```

## Compared to

| Tool | The gap |
|------|---------|
| `gitleaks` | Needs config and Docker for the full version |
| `pre-commit.com` | Needs Python on every dev machine |
| `husky` + `lint-staged` | Lockfile and Node version dance, breaks on Windows |
| `lint-staged` alone | Needs a linter to be useful |

`stapes-precommit` is one command and zero per-dev requirements. Sane defaults. Fast enough to run on every commit.

## Source

Visible at https://github.com/stapesco/precommit. One-person brand project. Read the code. Fork it. PRs are not accepted.

## License

MIT