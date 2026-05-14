import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateKalshiGateEvaluationSummary} from '../src/validate-kalshi-gate-evaluation-summary.js';
const f=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json','utf8'));
test('fixture validates',()=>{
  const {valid,errors}=validateKalshiGateEvaluationSummary(f);
  assert.equal(valid,true,errors.join('; '));
});
test('rejects gates_passed=true',()=>{
  const bad={...f,safety_flags:{...f.safety_flags,gates_passed:true}};
  const {valid}=validateKalshiGateEvaluationSummary(bad);
  assert.equal(valid,false);
});
