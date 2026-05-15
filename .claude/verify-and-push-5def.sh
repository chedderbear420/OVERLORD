#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== Final verification ==="
rtk git status
rtk git log --oneline -10

echo "=== Phase validators ==="
rtk npm run validate:kalshi-gate-evaluation-summary
rtk npm run validate:kalshi-operator-signoff-contract
rtk npm run validate:kalshi-phase6-readiness-lock

echo "=== Dashboard checks ==="
rtk npm run test:dashboard
rtk npm run test:dashboard-drift

echo "=== Strategy DSL tests (capped) ==="
rtk npm run test:strategy-dsl 2>&1 | head -160

echo "=== Diff stat ==="
rtk git diff --stat main...HEAD

echo "=== RTK gain history ==="
rtk gain --history || true

echo "=== RTK discover ==="
rtk discover || true

echo "=== Push branch for review only ==="
git push -u origin phase-5d-5f-confidence-gate-closeout
