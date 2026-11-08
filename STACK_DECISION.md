# Stack Decision

Status: accepted. Date: 2026-11-08. Applies to `stapes-precommit` v0.2.0.

## 1. Hard constraints

These cannot be overridden by preference.

- **Published npm package.** The tool runs on other people's machines through
  `npx`. A runtime floor that excludes current LTS releases is a hard
  constraint, because the audience is not under our control.
- **Node.js 18 and Node 20 are end-of-life.** Node 18 ended 2025-04-30. Node
  20 ended 2026-04-30. Neither may stay in the supported floor.
- **Zero runtime dependencies beyond `commander`.** The README promises one
  binary and no install step. Every added runtime dependency breaks that
  promise.
- **ESM only.** The package declares `"type": "module"`. A CommonJS-only
  dependency is not admissible.
- **Offline operation.** No network calls at runtime. A dependency that phones
  home is not admissible.

## 2. Workload profile

| Property | Value |
|---|---|
| System class | Command-line utility, single process, short-lived |
| Dominant workload | Read staged files from the git index, run regex and filesystem checks, print a report |
| Interaction model | Batch. One invocation, one exit code |
| Interface surface | CLI flags, a stable `--json` shape, exit codes |
| Runtime footprint | Single Node process, one dependency tree |
| Consumers | Developers running `npx`, CI pipelines, AI agents parsing `--json` |

## 3. Stack decision

| Layer | Candidates | Chosen | Reason |
|---|---|---|---|
| Runtime | Node 18, 20, 22, 24 | **Node >= 22.12.0** | The only floor that excludes both EOL lines while staying on an LTS release. 22.12 is the exact floor `commander` 15 declares, so the two agree. Node 22 runs to 2027-04-30. |
| CLI library | commander 11, 12, 13, 14, 15 | **commander 15** | 15 is the only current major that is ESM-native. 14 is CommonJS and would need a second floor at Node 20. 12 and 13 work but sit two and three majors behind. |
| Test runner | vitest 1, 2, 3, 4, 5 | **vitest 5** | 1.x carries three advisories, including a critical prototype pollution flaw in `tinypool` (GHSA-5gmw-xhrv-c9v3). 3.x still carries two. 4 and 5 audit clean. 5 is the current major. |
| Compiler | typescript 5, 6, 7 | **typescript 7** | The current stable. The source needed one change: `compilerOptions.types` must name `node`, otherwise the compiler cannot resolve the Node builtins. |
| Type definitions | @types/node 20, 22, 24, 26 | **@types/node 26** | Matches the newest LTS line the CI matrix exercises. |
| Module system | ESM | **ESM** | Already declared. The package ships ESM and the build output stays ESM. |
| CI | GitHub Actions | **GitHub Actions** | The repository already lives there and the release workflow already publishes from it. |

Per-layer scores use Functional, Performance, Ecosystem, Productivity, Deploy,
Security, and Maintainability, minus Operational Complexity, Lock-in, and
Unnecessary Infrastructure. The two decisive inputs were the advisory counts
and the `engines` fields of the candidate packages.

## 4. Default and override log

| Preference | Class | Outcome |
|---|---|---|
| Node 18 support | Strong preference, previously held | **Overridden.** Node 18 is end-of-life. Keeping it would ship a package that runs on an unpatched runtime. |
| Node 22 over Node 24 | Strong preference, newly held | **Held.** Node 24 narrows the audience for no gain: both are LTS, and 22 covers more users. |
| commander 15 over 14 | Strong preference, newly held | **Overridden toward 15.** Commander 14 is CommonJS. The package is ESM, so 15 avoids a dual-format build. |
| TypeScript 7 | Soft preference | **Held.** It is the current stable and the source compiles cleanly with one `types` entry. |
| Vitest 5 over 4 | Soft preference | **Held.** Both audit clean. 5 is current. |

## 5. Revisit triggers

Re-open this decision when any of these fires.

| Trigger | Date or condition |
|---|---|
| Node 22 reaches end of life | 2027-04-30. Raise the floor to Node 24 at that point. |
| `commander` 16 releases | Re-check whether the ESM floor and the Node floor still agree. |
| `vitest` 6 releases | Re-run the advisory audit before adopting it. |
| A new advisory appears in the dependency tree | Any `npm audit` finding above `moderate` triggers an immediate re-evaluation. |
| The published user base no longer runs Node 22 | Confirm the floor against download telemetry before raising it. |
| `typescript` 8 releases | Verify the `types` configuration still applies, then upgrade. |
