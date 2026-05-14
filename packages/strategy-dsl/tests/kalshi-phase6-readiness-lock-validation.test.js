import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateKalshiPhase6ReadinessLock} from '../src/validate-kalshi-phase6-readiness-lock.js';
const f=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_phase6_readiness_lock.json','utf8'));
test('fixture validates',()=>{
  const {valid,errors}=validateKalshiPhase6ReadinessLock(f);
  assert.equal(valid,true,errors.join('; '));
});
test('rejects phase_6_ready=true',()=>{
  const bad={...f,safety_flags:{...f.safety_flags,phase_6_ready:true}};
  const {valid}=validateKalshiPhase6ReadinessLock(bad);
  assert.equal(valid,false);
});
