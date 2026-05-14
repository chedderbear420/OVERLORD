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
