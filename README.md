# stapes-precommit

Zero-config pre-commit hook with 5 sanity checks. Catch the common screw-ups before they hit the remote.

```bash
npx stapes-precommit --init
```

Then `git commit` runs the checks automatically.

## What it catches

| Check         | What                                                                         | Default   |
| ------------- | ---------------------------------------------------------------------------- | --------- |
| `secrets`     | AWS keys, GitHub PATs, OpenAI/Anthropic, Stripe, JWT, PEM, generic passwords | **block** |
| `large-files` | Files > 10 MB (block); > 1 MB (warn)                                         | **block** |
| `console`     | `console.log` / `console.warn` in `.ts`/`.js` code (skip tests, scripts/)    | **block** |
| `todo`        | `TODO` / `FIXME` / `XXX` without a ticket reference                          | **warn**  |
| `filesize`    | Sensitive filenames (`.env`, `*.pem`, `id_rsa`, `credentials.json`, etc.)    | **block** |

No config required. Run, see, fix.

## Install

```bash
# One-time, in any repo
npx stapes-precommit --init

# Optional: write a default config to opt out / customize
npx stapes-precommit --init-config .stapes-precommit.json
```

## CLI

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

## Example output

```
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

## Why not husky / pre-commit / lint-staged?

| Tool                    | Why we built stapes-precommit instead                 |
| ----------------------- | ----------------------------------------------------- |
| `gitleaks`              | Excellent but needs config + Docker for full version  |
| `pre-commit.com`        | Needs Python; every dev needs it installed            |
| `husky` + `lint-staged` | Lockfile + node-version dependency, breaks on Windows |
| `lint-staged` alone     | Useful but needs the linter to be useful              |

`stapes-precommit` is one command, zero per-dev requirements, sane defaults, fast enough to run on every commit.

## Source

Visible at https://github.com/stapesco/precommit. **This is brand project.** Read the code. Fork it. Don't expect PRs to be merged.

## License

MIT
