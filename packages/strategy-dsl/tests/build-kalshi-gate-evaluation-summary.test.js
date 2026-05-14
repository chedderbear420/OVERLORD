import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildKalshiGateEvaluationSummary} from '../src/build-kalshi-gate-evaluation-summary.js';
const eb=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_paper_readiness_gate_evidence_bundle.json','utf8'));
test('builds summary with all gates blocked',()=>{
  const s=buildKalshiGateEvaluationSummary(eb);
  assert.equal(s.gates_passed_count,0);
  assert.equal(s.safety_flags.gates_passed,false);
  assert.equal(s.safety_flags.phase_6_ready,false);
});
