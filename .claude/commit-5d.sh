#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== Phase 5D commit ==="
git add packages/strategy-dsl/schemas/kalshi_gate_evaluation_summary.schema.json
git add packages/strategy-dsl/src/kalshi-gate-evaluation-summary-id.js
git add packages/strategy-dsl/src/build-kalshi-gate-evaluation-summary.js
git add packages/strategy-dsl/src/validate-kalshi-gate-evaluation-summary.js
git add packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json
git add packages/strategy-dsl/tests/build-kalshi-gate-evaluation-summary.test.js
git add packages/strategy-dsl/tests/kalshi-gate-evaluation-summary-validation.test.js
git add packages/strategy-dsl/docs/PHASE_5D_GATE_EVALUATION_SUMMARY.md
git add package.json CLAUDE.md docs/ROADMAP.md
git commit -m "Phase 5D: add blocked gate evaluation summary"

echo "=== Phase 5D committed. Starting Phase 5E... ==="
