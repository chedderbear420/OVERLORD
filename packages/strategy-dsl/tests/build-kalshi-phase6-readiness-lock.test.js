import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildKalshiPhase6ReadinessLock} from '../src/build-kalshi-phase6-readiness-lock.js';
const sc=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_operator_signoff_contract.json','utf8'));
test('builds lock with phase 6 locked',()=>{
  const l=buildKalshiPhase6ReadinessLock(sc);
  assert.equal(l.readiness_lock_status,'locked');
  assert.equal(l.safety_flags.phase_6_ready,false);
  assert.equal(l.safety_flags.gates_passed,false);
  assert.equal(l.safety_flags.operator_signoff_complete,false);
});
