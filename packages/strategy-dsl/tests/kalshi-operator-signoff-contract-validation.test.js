import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateKalshiOperatorSignoffContract} from '../src/validate-kalshi-operator-signoff-contract.js';
const f=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_operator_signoff_contract.json','utf8'));
test('fixture validates',()=>{
  const {valid,errors}=validateKalshiOperatorSignoffContract(f);
  assert.equal(valid,true,errors.join('; '));
});
test('rejects operator_signoff_complete=true',()=>{
  const bad={...f,operator_signoff_complete:true};
  const {valid}=validateKalshiOperatorSignoffContract(bad);
  assert.equal(valid,false);
});
