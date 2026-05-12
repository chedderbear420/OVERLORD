# CLAUDE.md — Overlord Repo Entrypoint

Overlord is a Kalshi sports prediction-market research OS. Research-only and paper-only. No live Kalshi connection, no credentials, no real order placement in the current phase.

---

## Start-of-session bootstrap

Run in this order. Stop and read before touching any code.

```bash
git status
git log --oneline -10
```

Then read exactly these files — no more:

```
AGENTS.md                             # full safety rules, RTK guide, test and search commands
docs/agent-operating-standard.md      # Phase 4D agent workflow, forbidden behaviors, report template
```

Identify the current phase and the smallest package surface relevant to the task before opening any source file.

---

## Current phase (as of Phase 4P)

| Phase | Title | Status |
|---|---|---|
| 4M | Market Data Ingest & Fixture Format | complete |
| 4N | Strategy Signal Definition | complete |
| 4O | Signal Evaluation Pass | complete |
| 4P | Paper Ledger Entry Contract | active — PR open |
| 4Q | Paper Ledger Aggregation | next |

---

## Repo layout (high-signal files only)

```
AGENTS.md                              primary safety and workflow rules
docs/agent-operating-standard.md       Phase 4D agent operating guide
docs/ROADMAP.md                        high-level phase roadmap
package.json                           all npm validate: and test: scripts
packages/strategy-dsl/                 active development package
  src/                                 validators and builders
  fixtures/                            synthetic fixtures (read-only)
  schemas/                             JSON schemas
  tests/                               node:test suite
apps/dashboard/                        offline read-only dashboard (Phase 4J)
  index.html                           open directly in browser — no build step
  test-dashboard-safety.js             static safety scan (39 checks)
  test-dashboard-fixture-drift.js      fixture drift guard (19 checks)
.agents/skills/                        domain-specific Codex skills (15 total)
```

---

## Key commands

```bash
# Dashboard
npm run dashboard                      # open dashboard in browser (Windows)
npm run test:dashboard                 # 39-check static safety scan
npm run test:dashboard-drift           # 19-check fixture drift guard

# Strategy DSL validators
npm run validate:kalshi-readonly-adapter-contract
npm run validate:kalshi-market-snapshot
npm run validate:kalshi-strategy-signal-definition
npm run validate:kalshi-signal-evaluation-summary
npm run validate:kalshi-paper-ledger-entry
npm run validate:strategy-observation-processing-contract
npm run validate:strategy-observation-processing-input-set
npm run validate:strategy-observation-processing-artifact-manifest
npm run validate:strategy-observation-processing-trace
npm run validate:strategy-observation-processing-noop-summary
npm run test:strategy-dsl              # ~317 tests (2 pre-existing CRLF failures on Windows)

# Run any other package
npm run test:<package-name>
npm run validate:<validator-name>
```

Always use the `npm run` scripts in `package.json`. Do not invoke node directly against test files unless debugging a single file.

---

## Forbidden behaviors

These are hard rules regardless of task scope:

- No Kalshi API calls, credentials, tokens, env loading, or `.env` files
- No live order placement, execution logic, or bankroll actions
- No polling, WebSockets, cron jobs, or background workers
- No weakening of safety flags — `paper_only: true`, `live_execution_allowed: false`, `order_placement_allowed: false` must never be set to the opposite
- No broad repo searches — scope all `grep` / `rg` / `find` to specific directories
- Do not dump large directories, lockfiles, or `node_modules` into context
- Do not generate signals, recommendations, edge, EV, probability, or trading decisions

---

## Phase report format

See the compact template in `docs/agent-operating-standard.md`. Use it at the end of every phase task.

---

## Full rules

`AGENTS.md` is the authoritative rule source. Read it at session start. This file is the Claude Code entrypoint; `AGENTS.md` has the complete picture.
