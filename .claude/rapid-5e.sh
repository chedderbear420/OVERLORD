#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== Phase 5E: KalshiOperatorSignoffContract ==="

# Schema
cat > packages/strategy-dsl/schemas/kalshi_operator_signoff_contract.schema.json << 'EOF'
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"kalshi_operator_signoff_contract.schema.json","title":"KalshiOperatorSignoffContract","description":"Phase 5E — Operator signoff contract. Manual review required. No signoff complete. No approval token.","type":"object","additionalProperties":false,"required":["kalshi_operator_signoff_contract_id","schema_version","generated_at","phase","signoff_status","upstream_gate_evaluation_summary_id","upstream_summary_schema_version","operator_signoff_complete","manual_review_required","operator_review_required","safety_flags","forbidden_capabilities","allowed_outputs","forbidden_outputs","reason_code","reason"],"properties":{"kalshi_operator_signoff_contract_id":{"type":"string","pattern":"^kosc_[a-f0-9]{32}$"},"schema_version":{"const":"kalshi_operator_signoff_contract.v1"},"generated_at":{"type":"string","format":"date-time"},"phase":{"const":"Phase 5E"},"signoff_status":{"enum":["not_complete","awaiting_review","blocked"]},"upstream_gate_evaluation_summary_id":{"type":"string","pattern":"^kges_[a-f0-9]{32}$"},"upstream_summary_schema_version":{"const":"kalshi_gate_evaluation_summary.v1"},"operator_signoff_complete":{"const":false},"manual_review_required":{"const":true},"operator_review_required":{"const":true},"safety_flags":{"type":"object","additionalProperties":false,"required":["paper_only","phase_6_ready","live_mode_allowed","order_placement_allowed","credentials_allowed","autonomous_execution_allowed","operator_signoff_complete"],"properties":{"paper_only":{"const":true},"phase_6_ready":{"const":false},"live_mode_allowed":{"const":false},"order_placement_allowed":{"const":false},"credentials_allowed":{"const":false},"autonomous_execution_allowed":{"const":false},"operator_signoff_complete":{"const":false}}},"forbidden_capabilities":{"type":"array","items":{"type":"string"},"minItems":1},"allowed_outputs":{"type":"array","items":{"type":"string"},"minItems":1},"forbidden_outputs":{"type":"array","items":{"type":"string"},"minItems":1},"reason_code":{"const":"OPERATOR_SIGNOFF_NOT_COMPLETE"},"reason":{"type":"string","minLength":1}}}
EOF

# ID
cat > packages/strategy-dsl/src/kalshi-operator-signoff-contract-id.js << 'EOF'
import {createHash} from "node:crypto";
const SCHEMA_VERSION="kalshi_operator_signoff_contract.v1";
export function kalshiOperatorSignoffContractId({phase,signoffStatus,operatorSignoffComplete}){
  if(!phase||!signoffStatus||operatorSignoffComplete==null) throw new Error("kalshiOperatorSignoffContractId: all inputs required");
  const digest=createHash("sha256").update([phase,SCHEMA_VERSION,signoffStatus,String(operatorSignoffComplete)].join("|")).digest("hex").slice(0,32);
  return `kosc_${digest}`;
}
EOF

# Builder
cat > packages/strategy-dsl/src/build-kalshi-operator-signoff-contract.js << 'EOF'
import {kalshiOperatorSignoffContractId} from "./kalshi-operator-signoff-contract-id.js";
const SCHEMA_VERSION="kalshi_operator_signoff_contract.v1";
const PHASE="Phase 5E";
const SIGNOFF_STATUS="not_complete";
const OPERATOR_SIGNOFF_COMPLETE=false;
const MANUAL_REVIEW_REQUIRED=true;
const OPERATOR_REVIEW_REQUIRED=true;
const REASON_CODE="OPERATOR_SIGNOFF_NOT_COMPLETE";
const REASON="operator signoff not complete; manual review required; paper mode remains blocked";
export const defaultContractOptions={generatedAt:"2026-05-14T00:00:00Z"};
export function buildKalshiOperatorSignoffContract(gateSummary,options={}){
  const opts={...defaultContractOptions,...options};
  const id=kalshiOperatorSignoffContractId({phase:PHASE,signoffStatus:SIGNOFF_STATUS,operatorSignoffComplete:OPERATOR_SIGNOFF_COMPLETE});
  return {
    kalshi_operator_signoff_contract_id:id,
    schema_version:SCHEMA_VERSION,
    generated_at:opts.generatedAt,
    phase:PHASE,
    signoff_status:SIGNOFF_STATUS,
    upstream_gate_evaluation_summary_id:gateSummary.kalshi_gate_evaluation_summary_id,
    upstream_summary_schema_version:"kalshi_gate_evaluation_summary.v1",
    operator_signoff_complete:OPERATOR_SIGNOFF_COMPLETE,
    manual_review_required:MANUAL_REVIEW_REQUIRED,
    operator_review_required:OPERATOR_REVIEW_REQUIRED,
    safety_flags:{paper_only:true,phase_6_ready:false,live_mode_allowed:false,order_placement_allowed:false,credentials_allowed:false,autonomous_execution_allowed:false,operator_signoff_complete:false},
    forbidden_capabilities:["live_trading","order_placement","credentials","api_keys","autonomous_execution","approval_token","signature_secret","phase_6_unlock"],
    allowed_outputs:["signoff_status_report","review_request_metadata"],
    forbidden_outputs:["approval_token","signature","credentials","live_orders","phase_6_approval"],
    reason_code:REASON_CODE,
    reason:REASON
  };
}
EOF

# Fixture
node << 'NODE5E'
import {readFileSync,writeFileSync} from 'node:fs';
import {buildKalshiOperatorSignoffContract} from './packages/strategy-dsl/src/build-kalshi-operator-signoff-contract.js';
const gs=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json','utf8'));
const c=buildKalshiOperatorSignoffContract(gs);
writeFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_operator_signoff_contract.json',JSON.stringify(c,null,2)+'\n','utf8');
console.log('5E fixture:',c.kalshi_operator_signoff_contract_id);
NODE5E

# Validator
cat > packages/strategy-dsl/src/validate-kalshi-operator-signoff-contract.js << 'EOF'
import {readFileSync} from 'node:fs';
export function validateKalshiOperatorSignoffContract(c){
  const e=[];
  if(!c||typeof c!=='object') return {valid:false,errors:['must be object']};
  if(c.schema_version!=='kalshi_operator_signoff_contract.v1') e.push('bad schema_version');
  if(c.phase!=='Phase 5E') e.push('bad phase');
  if(c.operator_signoff_complete!==false) e.push('operator_signoff_complete must be false');
  if(c.manual_review_required!==true) e.push('manual_review_required must be true');
  if(c.safety_flags?.phase_6_ready!==false) e.push('safety_flags.phase_6_ready must be false');
  return {valid:e.length===0,errors:e};
}
export function validateKalshiOperatorSignoffContractFile(p){
  try{const c=JSON.parse(readFileSync(p,'utf8'));return validateKalshiOperatorSignoffContract(c);}catch(err){return {valid:false,errors:[err.message]};}
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/').split('/').pop())){
  const r=validateKalshiOperatorSignoffContractFile('packages/strategy-dsl/fixtures/synthetic_kalshi_operator_signoff_contract.json');
  console.log(r.valid?'PASS':'FAIL',r.errors.join('; '));
  process.exit(r.valid?0:1);
}
EOF

# Tests
cat > packages/strategy-dsl/tests/build-kalshi-operator-signoff-contract.test.js << 'EOF'
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
EOF

cat > packages/strategy-dsl/tests/kalshi-operator-signoff-contract-validation.test.js << 'EOF'
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
EOF

# Doc
cat > packages/strategy-dsl/docs/PHASE_5E_OPERATOR_SIGNOFF_CONTRACT.md << 'EOF'
# Phase 5E — Operator Sign-off Contract
Operator sign-off contract. Manual review required. No signoff complete. No approval token. No credential logic.
## Safety
- operator_signoff_complete: false (const)
- manual_review_required: true (const)
- safety_flags.phase_6_ready: false (const)
- No approval token, signature secret, or credential logic
## Validate
\`\`\`bash
npm run validate:kalshi-operator-signoff-contract
\`\`\`
EOF

# Update package.json
node << 'PKG5E'
import {readFileSync,writeFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync('package.json','utf8'));
pkg.scripts['validate:kalshi-operator-signoff-contract']='node packages/strategy-dsl/src/validate-kalshi-operator-signoff-contract.js';
writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('package.json updated for 5E');
PKG5E

echo "Phase 5E complete. Committing..."
git add packages/strategy-dsl/schemas/kalshi_operator_signoff_contract.schema.json
git add packages/strategy-dsl/src/kalshi-operator-signoff-contract-id.js
git add packages/strategy-dsl/src/build-kalshi-operator-signoff-contract.js
git add packages/strategy-dsl/src/validate-kalshi-operator-signoff-contract.js
git add packages/strategy-dsl/fixtures/synthetic_kalshi_operator_signoff_contract.json
git add packages/strategy-dsl/tests/build-kalshi-operator-signoff-contract.test.js
git add packages/strategy-dsl/tests/kalshi-operator-signoff-contract-validation.test.js
git add packages/strategy-dsl/docs/PHASE_5E_OPERATOR_SIGNOFF_CONTRACT.md
git add package.json
git commit -m "Phase 5E: add operator sign-off contract"

echo "=== Phase 5E committed. Moving to Phase 5F... ==="
