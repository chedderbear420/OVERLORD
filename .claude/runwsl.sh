#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
cd ~/Projects/Overlord

echo "=== Copy Phase 5D files from Windows repo to WSL repo ==="
cp /mnt/c/Users/chedd/projects/OVERLORD/packages/strategy-dsl/schemas/kalshi_gate_evaluation_summary.schema.json packages/strategy-dsl/schemas/
cp /mnt/c/Users/chedd/projects/OVERLORD/packages/strategy-dsl/src/kalshi-gate-evaluation-summary-id.js packages/strategy-dsl/src/
cp /mnt/c/Users/chedd/projects/OVERLORD/packages/strategy-dsl/src/build-kalshi-gate-evaluation-summary.js packages/strategy-dsl/src/

echo "=== Generate fixture ==="
node -e "
import { readFileSync, writeFileSync } from 'node:fs';
import { buildKalshiGateEvaluationSummary } from './packages/strategy-dsl/src/build-kalshi-gate-evaluation-summary.js';

const evidenceBundle = JSON.parse(
  readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_paper_readiness_gate_evidence_bundle.json', 'utf8')
);

const summary = buildKalshiGateEvaluationSummary(evidenceBundle);

writeFileSync(
  'packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json',
  JSON.stringify(summary, null, 2) + '\\n',
  'utf8'
);

console.log('Fixture generated:', summary.kalshi_gate_evaluation_summary_id);
"

echo "=== Confirm files ==="
ls -la packages/strategy-dsl/schemas/kalshi_gate_evaluation_summary.schema.json
ls -la packages/strategy-dsl/src/kalshi-gate-evaluation-summary-id.js
ls -la packages/strategy-dsl/src/build-kalshi-gate-evaluation-summary.js
ls -la packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json
