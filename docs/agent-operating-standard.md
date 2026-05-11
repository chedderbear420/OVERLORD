# Agent Repo Operating Standard

This is the repo-facing operating guide for AI agents working in Overlord.

Overlord is a Kalshi-only, read-only and paper-trading strategy lab. Agents must preserve the offline-safe posture: no credentials, no live Kalshi execution, no real orders, no bankroll actions, and no trading recommendations.

## Default workflow

1. Start by reading small, high-signal files only.
2. Identify the current phase and the smallest relevant package surface.
3. Inspect targeted files before changing anything.
4. Modify docs, schemas, fixtures, validators, or tests only when the mission requires it.
5. Run the smallest relevant validation and test commands.
6. Report exactly what changed, what ran, what passed or failed, and what remains risky.

Do not dump the repo into context. Do not run broad searches over common words. Do not touch secrets, credentials, environment files, live API wiring, or execution pathways.

## Targeted discovery patterns

Prefer narrow file discovery:

```bash
find docs -maxdepth 2 -type f | sort
find packages/strategy-dsl -maxdepth 3 -type f | sort
find packages/replay-engine -maxdepth 3 -type f | sort
```

Prefer targeted text search:

```bash
grep -R "strategy_observation_processing_contract" packages/strategy-dsl docs -n
grep -R "paper_only" packages/strategy-dsl packages/replay-engine docs -n
grep -R "live_execution_allowed" packages docs -n
```

When `rg` is available, prefer scoped searches:

```bash
rg "strategy_observation_processing_contract" packages/strategy-dsl docs
rg "paper_only|live_execution_allowed|order_placement_allowed" packages docs
```

Avoid broad searches that flood context:

```bash
# Bad
grep -R "forbidden" .
rg "trade" .
find . -type f
ls -R
cat packages/strategy-dsl/src/*.js
```

## Python environment and pytest patterns

Use Python only when the repo or task actually includes Python files, pytest tests, or Python tooling.

Respect an existing virtual environment when present:

```bash
# Bash / WSL
[ -d .venv ] && source .venv/bin/activate
[ -d venv ] && source venv/bin/activate

# PowerShell
if (Test-Path .venv\Scripts\Activate.ps1) { . .venv\Scripts\Activate.ps1 }
if (Test-Path venv\Scripts\Activate.ps1) { . venv\Scripts\Activate.ps1 }
```

If pytest is relevant, use module form so the active interpreter is explicit:

```bash
python -m pytest
python -m pytest tests/test_specific_file.py
python -m pytest tests/test_specific_file.py -q
```

Do not create, recreate, or delete virtual environments unless the mission explicitly requires dependency setup.

## Node validation and test patterns

Use the scripts in `package.json` instead of inventing ad hoc commands.

Small package-level examples:

```bash
npm run validate:strategy-observation-processing-contract
npm run validate:strategy-observation-processing-input-set
npm run validate:strategy-observation-processing-artifact-manifest
npm run test:strategy-dsl
```

Replay package examples:

```bash
npm run validate:replay-run-manifest
npm run validate:replay-trace
npm run test:replay-engine
```

Paper-trader examples:

```bash
npm run validate:paper-ledger
npm run validate:paper-exits
npm run validate:paper-performance-summary
npm run test:paper-trader
```

For docs-only changes, a targeted inspection of affected links and package metadata is acceptable when no doc linter exists.

## Forbidden agent behaviors

Agents must not:

- Run live Kalshi API calls.
- Add, read, print, move, or request credentials, API keys, tokens, cookies, or secret files.
- Add live order placement, cancellation, fill handling, bankroll movement, or automated execution logic.
- Convert read-only observations into trading recommendations or action instructions.
- Add hidden network calls, background workers, cron jobs, or autonomous execution loops.
- Dump large directories, generated artifacts, lockfiles, dependency folders, or build outputs into context.
- Search the whole repo for common words such as `trade`, `order`, `signal`, `forbidden`, or `decision` without strict path scoping.
- Weaken safety flags such as `paper_only: true`, `live_execution_allowed: false`, or `order_placement_allowed: false`.

## Good vs bad command examples

Good:

```bash
cat README.md
cat docs/ROADMAP.md
cat package.json
find packages/strategy-dsl/tests -maxdepth 1 -type f | sort
rg "strategy_observation_processing" packages/strategy-dsl docs
npm run validate:strategy-observation-processing-contract
npm run test:strategy-dsl
```

Bad:

```bash
cat **/*
find . -type f -print -exec cat {} \;
grep -R "trade" .
rg "order" .
npm test
curl https://api.kalshi.com/...
printenv
cat .env
```

## Compact phase report template

Use this format at the end of every phase task:

```markdown
## Phase report

### Files changed
- `path/to/file`: short reason

### Commands run
- `command`

### Validation and test results
- Passed: ...
- Failed: ...
- Not run: ... with reason

### Safety guarantees preserved
- Research-only / paper-only: yes
- Live execution added: no
- Credential handling touched: no
- Order placement or bankroll logic added: no
- Trading recommendations added: no

### Risks / gaps
- ...

### Recommended next phase
- Phase X: ...
```

## Phase 4D completion rule

Phase 4D is complete when this guide exists in the repo, future agents have clear low-noise inspection rules, and the phase report confirms that no core trading logic or live execution pathway was modified.
