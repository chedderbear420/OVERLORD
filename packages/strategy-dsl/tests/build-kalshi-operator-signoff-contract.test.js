import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildKalshiOperatorSignoffContract} from '../src/build-kalshi-operator-signoff-contract.js';
const gs=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json','utf8'));
test('builds contract with signoff not complete',()=>{
  const c=buildKalshiOperatorSignoffContract(gs);
  assert.equal(c.operator_signoff_complete,false);
  assert.equal(c.manual_review_required,true);
  assert.equal(c.safety_flags.phase_6_ready,false);
});
