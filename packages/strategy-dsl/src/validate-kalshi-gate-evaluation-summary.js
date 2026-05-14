import {readFileSync} from 'node:fs';
export function validateKalshiGateEvaluationSummary(s){
  const e=[];
  if(!s||typeof s!=='object') return {valid:false,errors:['must be object']};
  if(s.schema_version!=='kalshi_gate_evaluation_summary.v1') e.push('bad schema_version');
  if(s.phase!=='Phase 5D') e.push('bad phase');
  if(s.gates_passed_count!==0) e.push('gates_passed_count must be 0');
  if(s.safety_flags?.gates_passed!==false) e.push('safety_flags.gates_passed must be false');
  if(s.safety_flags?.phase_6_ready!==false) e.push('safety_flags.phase_6_ready must be false');
  return {valid:e.length===0,errors:e};
}
export function validateKalshiGateEvaluationSummaryFile(p){
  try{
    const s=JSON.parse(readFileSync(p,'utf8'));
    return validateKalshiGateEvaluationSummary(s);
  }catch(err){return {valid:false,errors:[err.message]};}
}
if(process.argv[1]&&import.meta.url.endsWith(process.argv[1].replace(/\\/g,'/').split('/').pop())){
  const r=validateKalshiGateEvaluationSummaryFile('packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json');
  console.log(r.valid?'PASS':'FAIL',r.errors.join('; '));
  process.exit(r.valid?0:1);
}
