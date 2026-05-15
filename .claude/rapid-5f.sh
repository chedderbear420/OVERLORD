#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== Phase 5F: KalshiPhase6ReadinessLock ==="

# Schema
cat > packages/strategy-dsl/schemas/kalshi_phase6_readiness_lock.schema.json << 'EOF'
{"$schema":"https://json-schema.org/draft/2020-12/schema","$id":"kalshi_phase6_readiness_lock.schema.json","title":"KalshiPhase6ReadinessLock","description":"Phase 5F — Phase 6 readiness lock. Locked. No Phase 6 unlock. No live mode.","type":"object","additionalProperties":false,"required":["kalshi_phase6_readiness_lock_id","schema_version","generated_at","phase","readiness_lock_status","upstream_operator_signoff_id","upstream_signoff_schema_version","unlock_requirements","safety_flags","forbidden_capabilities","allowed_outputs","forbidden_outputs","reason_code","reason"],"properties":{"kalshi_phase6_readiness_lock_id":{"type":"string","pattern":"^kp6rl_[a-f0-9]{32}$"},"schema_version":{"const":"kalshi_phase6_readiness_lock.v1"},"generated_at":{"type":"string","format":"date-time"},"phase":{"const":"Phase 5F"},"readiness_lock_status":{"enum":["locked","blocked"]},"upstream_operator_signoff_id":{"type":"string","pattern":"^kosc_[a-f0-9]{32}$"},"upstream_signoff_schema_version":{"const":"kalshi_operator_signoff_contract.v1"},"unlock_requirements":{"type":"array","items":{"type":"string"},"minItems":1},"safety_flags":{"type":"object","additionalProperties":false,"required":["paper_only","phase_6_ready","live_mode_allowed","order_placement_allowed","credentials_allowed","autonomous_execution_allowed","gates_passed","operator_signoff_complete"],"properties":{"paper_only":{"const":true},"phase_6_ready":{"const":false},"live_mode_allowed":{"const":false},"order_placement_allowed":{"const":false},"credentials_allowed":{"const":false},"autonomous_execution_allowed":{"const":false},"gates_passed":{"const":false},"operator_signoff_complete":{"const":false}}},"forbidden_capabilities":{"type":"array","items":{"type":"string"},"minItems":1},"allowed_outputs":{"type":"array","items":{"type":"string"},"minItems":1},"forbidden_outputs":{"type":"array","items":{"type":"string"},"minItems":1},"reason_code":{"const":"PHASE_6_LOCKED"},"reason":{"type":"string","minLength":1}}}
EOF

# ID
cat > packages/strategy-dsl/src/kalshi-phase6-readiness-lock-id.js << 'EOF'
import {createHash} from "node:crypto";
const SCHEMA_VERSION="kalshi_phase6_readiness_lock.v1";
export function kalshiPhase6ReadinessLockId({phase,lockStatus,phase6Ready}){
  if(!phase||!lockStatus||phase6Ready==null) throw new Error("kalshiPhase6ReadinessLockId: all inputs required");
  const digest=createHash("sha256").update([phase,SCHEMA_VERSION,lockStatus,String(phase6Ready)].join("|")).digest("hex").slice(0,32);
  return `kp6rl_${digest}`;
}
EOF

# Builder
cat > packages/strategy-dsl/src/build-kalshi-phase6-readiness-lock.js << 'EOF'
import {kalshiPhase6ReadinessLockId} from "./kalshi-phase6-readiness-lock-id.js";
const SCHEMA_VERSION="kalshi_phase6_readiness_lock.v1";
const PHASE="Phase 5F";
const LOCK_STATUS="locked";
const PHASE6_READY=false;
const REASON_CODE="PHASE_6_LOCKED";
const REASON="phase 6 locked; all gates blocked; operator signoff not complete; paper mode remains blocked";
export const defaultLockOptions={generatedAt:"2026-05-14T00:00:00Z"};
export function buildKalshiPhase6ReadinessLock(signoffContract,options={}){
  const opts={...defaultLockOptions,...options};
  const id=kalshiPhase6ReadinessLockId({phase:PHASE,lockStatus:LOCK_STATUS,phase6Ready:PHASE6_READY});
  return {
    kalshi_phase6_readiness_lock_id:id,
    schema_version:SCHEMA_VERSION,
    generated_at:opts.generatedAt,
    phase:PHASE,
    readiness_lock_status:LOCK_STATUS,
    upstream_operator_signoff_id:signoffContract.kalshi_operator_signoff_contract_id,
    upstream_signoff_schema_version:"kalshi_operator_signoff_contract.v1",
    unlock_requirements:["all_gates_passed","operator_signoff_complete","risk_governor_implemented","manual_approval_obtained"],
    safety_flags:{paper_only:true,phase_6_ready:false,live_mode_allowed:false,order_placement_allowed:false,credentials_allowed:false,autonomous_execution_allowed:false,gates_passed:false,operator_signoff_complete:false},
    forbidden_capabilities:["live_trading","order_placement","credentials","api_keys","autonomous_execution","phase_6_unlock","live_mode_enablement"],
    allowed_outputs:["lock_status_report","unlock_requirement_checklist"],
    forbidden_outputs:["phase_6_approval","live_orders","credentials","unlock_token"],
    reason_code:REASON_CODE,
    reason:REASON
  };
}
EOF

# Fixture
node << 'NODE5F'
import {readFileSync,writeFileSync} from 'node:fs';
import {buildKalshiPhase6ReadinessLock} from './packages/strategy-dsl/src/build-kalshi-phase6-readiness-lock.js';
const sc=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_operator_signoff_contract.json','utf8'));
const l=buildKalshiPhase6ReadinessLock(sc);
writeFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_phase6_readiness_lock.json',JSON.stringify(l,null,2)+'\n','utf8');
console.log('5F fixture:',l.kalshi_phase6_readiness_lock_id);
NODE5F

# Validator
cat > packages/strategy-dsl/src/validate-kalshi-phase6-readiness-lock.js << 'EOF'
import {readFileSync} from 'node:fs';
export function validateKalshiPhase6ReadinessLock(l){
  const e=[];
  if(!l||typeof l!=='object') return {valid:false,errors:['must be object']};
  if(l.schema_version!=='kalshi_phase6_readiness_lock.v1') e.push('bad schema_version');
  if(l.phase!=='Phase 5F') e.push('bad phase');
  if(l.readiness_lock_status!=='locked'&&l.readiness_lock_status!=='blocked') e.push('lock_status must be locked or blocked');
  if(l.safety_flags?.phase_6_ready!==false) e.push('safety_flags.phase_6_ready must be false');
  if(l.safety_flags?.gates_passed!==false) e.push('safety_flags.gates_passed must be false');
  if(l.safety_flags?.operator_signoff_complete!==false) e.push('safety_flags.operator_signoff_complete must be false');
  return {valid:e.length===0,errors:e};
}
export function validateKalshiPhase6ReadinessLockFile(p){
  try{const l=JSON.parse(readFileSync(p,'utf8'));return validateKalshiPhase6ReadinessLock(l);}catch(err){return {valid:false,errors:[err.message]};}
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/').split('/').pop())){
  const r=validateKalshiPhase6ReadinessLockFile('packages/strategy-dsl/fixtures/synthetic_kalshi_phase6_readiness_lock.json');
  console.log(r.valid?'PASS':'FAIL',r.errors.join('; '));
  process.exit(r.valid?0:1);
}
EOF

# Tests
cat > packages/strategy-dsl/tests/build-kalshi-phase6-readiness-lock.test.js << 'EOF'
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
EOF

cat > packages/strategy-dsl/tests/kalshi-phase6-readiness-lock-validation.test.js << 'EOF'
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
EOF

# Doc
cat > packages/strategy-dsl/docs/PHASE_5F_PHASE6_READINESS_LOCK.md << 'EOF'
# Phase 5F — Phase 6 Readiness Lock
Phase 6 readiness lock. Locked. No Phase 6 unlock. No live mode implementation.
## Safety
- readiness_lock_status: locked
- phase_6_ready: false (const)
- gates_passed: false (const)
- operator_signoff_complete: false (const)
- No Phase 6 implementation, no live mode logic, no credential logic
## Validate
\`\`\`bash
npm run validate:kalshi-phase6-readiness-lock
\`\`\`
EOF

# Update package.json
node << 'PKG5F'
import {readFileSync,writeFileSync} from 'node:fs';
const pkg=JSON.parse(readFileSync('package.json','utf8'));
pkg.scripts['validate:kalshi-phase6-readiness-lock']='node packages/strategy-dsl/src/validate-kalshi-phase6-readiness-lock.js';
writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n','utf8');
console.log('package.json updated for 5F');
PKG5F

# Update CLAUDE.md + ROADMAP.md
sed -i 's/| 5D | Gate Evaluation Summary | active — PR open |/| 5D | Gate Evaluation Summary | complete |/' CLAUDE.md
sed -i 's/| 5D | Gate Evaluation Summary | 🔁 ACTIVE |/| 5D | Gate Evaluation Summary | ✅ COMPLETE |/' docs/ROADMAP.md
cat >> CLAUDE.md << 'CLAEOF'

| 5E | Operator Sign-off Contract | complete |
| 5F | Phase 6 Readiness Lock | active — PR open |
CLAEOF
sed -i '/| 5E | Operator Sign-off Contract | ⬜ LATER |/a| 5E | Operator Sign-off Contract | ✅ COMPLETE |\n| 5F | Phase 6 Readiness Lock | 🔁 ACTIVE |' docs/ROADMAP.md

echo "Phase 5F complete. Committing..."
git add packages/strategy-dsl/schemas/kalshi_phase6_readiness_lock.schema.json
git add packages/strategy-dsl/src/kalshi-phase6-readiness-lock-id.js
git add packages/strategy-dsl/src/build-kalshi-phase6-readiness-lock.js
git add packages/strategy-dsl/src/validate-kalshi-phase6-readiness-lock.js
git add packages/strategy-dsl/fixtures/synthetic_kalshi_phase6_readiness_lock.json
git add packages/strategy-dsl/tests/build-kalshi-phase6-readiness-lock.test.js
git add packages/strategy-dsl/tests/kalshi-phase6-readiness-lock-validation.test.js
git add packages/strategy-dsl/docs/PHASE_5F_PHASE6_READINESS_LOCK.md
git add package.json CLAUDE.md docs/ROADMAP.md
git commit -m "Phase 5F: add Phase 6 readiness lock"

echo "=== All 3 phases committed. Running final verification... ==="
