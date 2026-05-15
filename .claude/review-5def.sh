#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== rtk git status ==="
rtk git status

echo "=== rtk git log --oneline -10 ==="
rtk git log --oneline -10

echo "=== validators ==="
rtk npm run validate:kalshi-gate-evaluation-summary
rtk npm run validate:kalshi-operator-signoff-contract
rtk npm run validate:kalshi-phase6-readiness-lock

echo "=== dashboard tests ==="
rtk npm run test:dashboard
rtk npm run test:dashboard-drift

echo "=== strategy-dsl (head 160) ==="
rtk npm run test:strategy-dsl 2>&1 | head -160 || true

echo "=== diff stat main...HEAD ==="
rtk git diff --stat main...HEAD

echo "=== diff schemas ==="
git diff main...HEAD -- packages/strategy-dsl/schemas/

echo "=== diff manifests ==="
git diff main...HEAD -- package.json CLAUDE.md docs/ROADMAP.md

echo "=== diff validators ==="
git diff main...HEAD -- packages/strategy-dsl/src/validate-kalshi-gate-evaluation-summary.js
git diff main...HEAD -- packages/strategy-dsl/src/validate-kalshi-operator-signoff-contract.js
git diff main...HEAD -- packages/strategy-dsl/src/validate-kalshi-phase6-readiness-lock.js

echo "=== diff tests ==="
git diff main...HEAD -- packages/strategy-dsl/tests/
