# Security

If you've found a security vulnerability in `stapes-precommit`, please
report it privately before public disclosure.

## How to report

Email **github@stapes.co.za** with:

- A short description of the issue
- Reproduction steps (or a minimal PoC)
- The version affected (`stapes-precommit --version`)
- Your expected disclosure timeline

Please **do not** open a public GitHub issue for security bugs.

## What to expect

- Acknowledgement within **5 business days**
- A fix or a clear timeline for a fix within **30 days** of acknowledgement
- Public disclosure coordinated with you, after the fix ships

There is **no bug bounty programme** and **no reward** for disclosure.
We fix issues because they're bugs, not because we're buying silence.

## Out of scope

- Lack of a feature (open a discussion, not a security report)
- Performance issues
- Compatibility issues with specific git versions, Node versions, or
  shells
- Reports about the dependency supply chain that are about a transitive
  dep rather than `stapes-precommit` itself

If you're not sure whether something is a security issue, report it.
We'll triage and let you know.

## Why this tool touches sensitive data

`stapes-precommit` reads staged files and runs pattern-matching on their
content (AWS keys, GitHub PATs, JWTs, etc.). The tool itself does not
phone home, does not log, and does not retain file contents. But because
it sees staged content, a malicious or compromised pre-commit hook chain
could leak it. If you discover a way to exfiltrate data through the
hooks this tool installs, please report it through the channel above.