# Overlord Repo Instructions

## Product
Overlord is a serious Kalshi sports prediction-market research operating system.

Current phase: scope, repo constitution, and repo-scoped Codex skills only.

## Permanent Rules
- Overlord defaults to research-only and paper-only modes.
- Live execution is forbidden until explicitly added in a later approved phase.
- No autonomous live trading.
- No hardcoded secrets.
- No bypassing Kalshi terms, account rules, rate limits, or safety controls.
- Do not create API key files.
- Do not create real order-placement code.
- Do not connect to Kalshi until an approved integration phase.
- Do not copy external repo source code.
- Do not integrate OpenClaw or MiroFish yet.
- Every strategy must define entry, exit, stop, no-trade conditions, risk limits, and required features.
- Every signal must record market state, model probability, observed price, raw edge, fees, spread, slippage, uncertainty penalty, net edge, liquidity status, risk status, and reason.
- Every market event and decision must be audit logged.
- MiroFish is an optional future narrative simulation adapter, not a truth engine and not a trading authority.
- OpenClaw is a future operator/assistant layer, not the trading brain and never allowed to override risk or permissions.
- Machine learning cannot be promoted until clean data, labels, replay results, and calibration reports exist.

## Core Principle
A signal is valid only if model probability, market price, fees, spread, liquidity, timing, replay evidence, calibration history, and risk checks all pass.

## Edge Thesis
Overlord's edge is not predicting winners. Its edge is identifying and proving short-horizon mispricing caused by reaction lag, behavioral overreaction, and market microstructure inefficiency, then validating whether the opportunity survives fees, spread, liquidity, slippage, uncertainty, and risk limits.

## Engineering Boundaries
- Prefer deterministic replay, paper trading, audit trails, and calibration reports over live actions.
- Treat market data as immutable source evidence once recorded.
- Separate raw data, normalized market state, features, labels, signals, simulated fills, and decisions.
- Keep risk governance and permission gates independent from strategy logic.
- Use explicit schemas for market state, edge signals, paper ledger entries, and replay outputs.
- Never add code that can place, route, or submit a real order in the current phase.

## Repo-Scoped Skills
Use `.agents/skills/*/SKILL.md` when work touches Overlord architecture, Kalshi market recording, binary order book normalization, signal design, strategy DSL, replay, execution simulation, risk, paper trading, calibration, ML governance, MiroFish boundaries, OpenClaw boundaries, secrets, or QA.

## RTK / Token Efficiency

### Primary AI/dev workspace

On this Windows machine, AI/dev agent work should prefer the WSL-native repo at `~/Projects/Overlord`. The Windows repo at `C:\Users\chedd\Projects\Overlord` is the secondary Windows-side copy. Avoid doing heavy AI/dev work from `/mnt/c/...` because cross-filesystem access is slower and can reduce RTK workflow performance. Keep the two copies synced through git.

RTK (Rust Token Killer) is globally installed. Verify with:

```bash
which rtk        # Git Bash / POSIX shells
where rtk        # PowerShell / CMD
rtk --version
```

Known Windows install path: `C:\Users\chedd\.local\bin\rtk.exe`.

On native Windows, RTK does not auto-rewrite shell commands. Use manual-prefix mode: put `rtk` before every command listed below.

### Always use RTK for these commands

```bash
rtk git status
rtk git log --oneline -10
rtk git diff --stat
rtk find . -maxdepth 3 -type f
rtk ls packages/
rtk npm run test:<package>
rtk npm run validate:<validator>
rtk grep -R "pattern" packages/<pkg>/src
```

### Critical rule: grep must be targeted — never broad

This repo's packages are large. Broad recursive grep across an entire package produces megabytes of output even through RTK and falls back to raw execution.

```bash
# OK — scoped to src/ or schemas/
rtk grep -R "pattern" packages/strategy-dsl/src
rtk grep -R "pattern" packages/strategy-dsl/schemas

# NOT OK — can flood context with megabytes of output
# rtk grep -R "pattern" packages/strategy-dsl
# rtk grep -R "pattern" packages/
```

### WSL Node rule

Before running tests or validate scripts in WSL, verify Node is v22+:

```bash
node --version   # must be v22.x or newer
```

Do not use Ubuntu apt Node 18 for this repo. It does not support `import.meta.dirname` and all tests will fail. Node 22 LTS is installed via nvm at `~/.nvm/versions/node/v22.22.2/bin/node`. If `node --version` shows 18, fix PATH first:

```bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$PATH"
```

### Search rule

Prefer `git grep` for code search — it is faster, scope-aware, and respects `.gitignore`. Use tightly scoped `rtk grep` only when `git grep` is insufficient.

```bash
# Preferred
git grep "pattern" -- packages/strategy-dsl/src/

# Acceptable — tightly scoped to src/ or schemas/ only
rtk grep -R "pattern" packages/strategy-dsl/src

# NOT OK — can produce megabytes of output
# rtk grep -R "pattern" packages/strategy-dsl
# grep -R "pattern" packages/
```

Never run broad `grep -R` across whole packages without a scope suffix.

### Test failure rule

On test failure, do not dump full output into context. Re-run the failing command with limited output, then summarize:

```bash
rtk npm run test:<pkg> 2>&1 | head -80
```

Failing test suites with many failures produce large TAP error blocks. Always cap output when debugging.

### Test commands for this repo

This repo uses `node --test` (no jest or vitest). Always run tests through `rtk npm run`:

```bash
rtk npm run test:strategy-dsl
rtk npm run test:replay-engine
rtk npm run test:paper-trader
rtk npm run test:risk-governor
rtk npm run test:edge-scanner
rtk npm run test:market-state-engine
rtk npm run test:event-store
rtk npm run test:binary-book-normalizer
```

Schema validators use `validate:` prefix scripts. Always RTK-prefix them:

```bash
rtk npm run validate:strategy-observation-processing-contract
rtk npm run validate:<any-other-validator>
```

### Commands to never run raw

| Avoid raw | Use instead |
|---|---|
| `find . -type f` | `rtk find . -maxdepth 3 -type f` |
| `grep -R "X" packages/` | `rtk grep -R "X" packages/<pkg>/src` |
| `node --test packages/…` | `rtk npm run test:<pkg>` |
| `ls -la packages/` | `rtk ls packages/` |

### Start-of-session sequence

```bash
rtk git status
rtk git log --oneline -10
rtk gain
```

### Before final answer or handoff

```bash
rtk git status
rtk git diff --stat
rtk npm run test:<relevant-package>
rtk gain --history
```

### RTK analytics

Run these periodically to measure context efficiency:

```bash
rtk gain              # current token savings summary
rtk gain --history    # recent command history with per-command savings rates
rtk session           # RTK adoption % across sessions
rtk discover          # find commands that bypassed RTK and should not have
```
