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
