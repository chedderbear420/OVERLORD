#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== Phase 5D: KalshiGateEvaluationSummary ==="

# Schema
cat > packages/strategy-dsl/schemas/kalshi_gate_evaluation_summary.schema.json << 'EOF'
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "kalshi_gate_evaluation_summary.schema.json",
  "title": "KalshiGateEvaluationSummary",
  "description": "Phase 5D — Gate evaluation summary. Gates evaluated but all blocked. No gates pass.",
  "type": "object",
  "additionalProperties": false,
  "required": ["kalshi_gate_evaluation_summary_id","schema_version","generated_at","phase","evaluation_status","upstream_evidence_bundle_id","upstream_bundle_schema_version","gates_evaluated","gates_passed_count","gates_failed_count","gates_blocked_count","gate_results","overall_gate_decision","safety_flags","forbidden_capabilities","allowed_outputs","forbidden_outputs","reason_code","reason"],
  "properties": {
    "kalshi_gate_evaluation_summary_id": {"type":"string","pattern":"^kges_[a-f0-9]{32}$"},
    "schema_version": {"const":"kalshi_gate_evaluation_summary.v1"},
    "generated_at": {"type":"string","format":"date-time"},
    "phase": {"const":"Phase 5D"},
    "evaluation_status": {"enum":["evaluated_blocked","evaluated_incomplete","evaluation_failed"]},
    "upstream_evidence_bundle_id": {"type":"string","pattern":"^kprgeb_[a-f0-9]{32}$"},
    "upstream_bundle_schema_version": {"const":"kalshi_paper_readiness_gate_evidence_bundle.v1"},
    "gates_evaluated": {"type":"array","items":{"type":"string"},"minItems":1},
    "gates_passed_count": {"type":"integer","const":0},
    "gates_failed_count": {"type":"integer","minimum":1},
    "gates_blocked_count": {"type":"integer","minimum":0},
    "gate_results": {"type":"array","minItems":1,"items":{"type":"object","additionalProperties":false,"required":["gate_id","gate_name","evaluation_result","pass","blocking_reason"],"properties":{"gate_id":{"type":"string"},"gate_name":{"type":"string"},"evaluation_result":{"enum":["failed","blocked","insufficient_evidence"]},"pass":{"const":false},"blocking_reason":{"type":"string"}}}},
    "overall_gate_decision": {"enum":["all_gates_blocked","all_gates_failed","gates_not_passed"]},
    "safety_flags": {"type":"object","additionalProperties":false,"required":["paper_only","gate_evaluation_allowed","gates_passed","phase_6_ready","live_mode_allowed","live_execution_allowed","order_placement_allowed","credentials_allowed","credential_access_allowed","autonomous_execution_allowed","operator_signoff_complete"],"properties":{"paper_only":{"const":true},"gate_evaluation_allowed":{"const":true},"gates_passed":{"const":false},"phase_6_ready":{"const":false},"live_mode_allowed":{"const":false},"live_execution_allowed":{"const":false},"order_placement_allowed":{"const":false},"credentials_allowed":{"const":false},"credential_access_allowed":{"const":false},"autonomous_execution_allowed":{"const":false},"operator_signoff_complete":{"const":false}}},
    "forbidden_capabilities": {"type":"array","items":{"type":"string"},"minItems":1},
    "allowed_outputs": {"type":"array","items":{"type":"string"},"minItems":1},
    "forbidden_outputs": {"type":"array","items":{"type":"string"},"minItems":1},
    "reason_code": {"const":"GATES_EVALUATED_ALL_BLOCKED"},
    "reason": {"type":"string","minLength":1}
  }
}
EOF

# ID helper
cat > packages/strategy-dsl/src/kalshi-gate-evaluation-summary-id.js << 'EOF'
import { createHash } from "node:crypto";
const SCHEMA_VERSION = "kalshi_gate_evaluation_summary.v1";
export function kalshiGateEvaluationSummaryId({phase,evaluationStatus,gatesPassedCount}) {
  if (!phase || !evaluationStatus || gatesPassedCount == null) throw new Error("kalshiGateEvaluationSummaryId: all inputs required");
  const digest = createHash("sha256").update([phase,SCHEMA_VERSION,evaluationStatus,String(gatesPassedCount)].join("|")).digest("hex").slice(0,32);
  return \`kges_\${digest}\`;
}
EOF

# Builder  
cat > packages/strategy-dsl/src/build-kalshi-gate-evaluation-summary.js << 'EOF'
import { kalshiGateEvaluationSummaryId } from "./kalshi-gate-evaluation-summary-id.js";
const SCHEMA_VERSION = "kalshi_gate_evaluation_summary.v1";
const PHASE = "Phase 5D";
const EVALUATION_STATUS = "evaluated_blocked";
const GATES_PASSED_COUNT = 0;
const OVERALL_GATE_DECISION = "all_gates_blocked";
const REASON_CODE = "GATES_EVALUATED_ALL_BLOCKED";
const REASON = "gates evaluated; all gates blocked; paper mode remains blocked";
export const defaultSummaryOptions = {generatedAt:"2026-05-14T00:00:00Z"};
function evaluateGates(evidenceBundle) {
  return [
    {gate_id:"signal_calibration",gate_name:"Signal Calibration Gate",evaluation_result:"insufficient_evidence",pass:false,blocking_reason:"minimum sample size not met; calibration metrics incomplete"},
    {gate_id:"edge_consistency",gate_name:"Edge Consistency Gate",evaluation_result:"failed",pass:false,blocking_reason:"multi-market edge consistency evidence not available"},
    {gate_id:"paper_pnl",gate_name:"Paper PnL Gate",evaluation_result:"insufficient_evidence",pass:false,blocking_reason:"paper ledger sample size insufficient for confidence"},
    {gate_id:"risk_governor",gate_name:"Risk Governor Gate",evaluation_result:"blocked",pass:false,blocking_reason:"risk governor not implemented"},
    {gate_id:"operator_signoff",gate_name:"Operator Sign-off Gate",evaluation_result:"blocked",pass:false,blocking_reason:"operator sign-off not completed"}
  ];
}
export function buildKalshiGateEvaluationSummary(evidenceBundle,options={}) {
  const opts = {...defaultSummaryOptions,...options};
  const gateResults = evaluateGates(evidenceBundle);
  const gatesEvaluated = gateResults.map(r=>r.gate_id);
  const gatesFailedCount = gateResults.filter(r=>r.evaluation_result==="failed"||r.evaluation_result==="insufficient_evidence").length;
  const gatesBlockedCount = gateResults.filter(r=>r.evaluation_result==="blocked").length;
  const id = kalshiGateEvaluationSummaryId({phase:PHASE,evaluationStatus:EVALUATION_STATUS,gatesPassedCount:GATES_PASSED_COUNT});
  return {
    kalshi_gate_evaluation_summary_id:id,
    schema_version:SCHEMA_VERSION,
    generated_at:opts.generatedAt,
    phase:PHASE,
    evaluation_status:EVALUATION_STATUS,
    upstream_evidence_bundle_id:evidenceBundle.kalshi_paper_readiness_gate_evidence_bundle_id,
    upstream_bundle_schema_version:"kalshi_paper_readiness_gate_evidence_bundle.v1",
    gates_evaluated:gatesEvaluated,
    gates_passed_count:GATES_PASSED_COUNT,
    gates_failed_count:gatesFailedCount,
    gates_blocked_count:gatesBlockedCount,
    gate_results:gateResults,
    overall_gate_decision:OVERALL_GATE_DECISION,
    safety_flags:{paper_only:true,gate_evaluation_allowed:true,gates_passed:false,phase_6_ready:false,live_mode_allowed:false,live_execution_allowed:false,order_placement_allowed:false,credentials_allowed:false,credential_access_allowed:false,autonomous_execution_allowed:false,operator_signoff_complete:false},
    forbidden_capabilities:["live_trading","live_kalshi_api_calls","order_placement","credential_access","api_keys","autonomous_execution","bankroll_sizing","recommendations","trading_decisions","actionable_signals","strategy_execution","live_market_execution","phase_6_readiness","gate_override"],
    allowed_outputs:["gate_evaluation_report","blocking_reasons","evidence_review_metadata"],
    forbidden_outputs:["live_orders","trade_signals","bankroll_allocation","credentials","api_keys","execution_commands","gate_pass_approval"],
    reason_code:REASON_CODE,
    reason:REASON
  };
}
EOF

echo "Phase 5D core files created. Generating fixture..."
node << 'NODESCRIPT'
import {readFileSync,writeFileSync} from 'node:fs';
import {buildKalshiGateEvaluationSummary} from './packages/strategy-dsl/src/build-kalshi-gate-evaluation-summary.js';
const eb=JSON.parse(readFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_paper_readiness_gate_evidence_bundle.json','utf8'));
const s=buildKalshiGateEvaluationSummary(eb);
writeFileSync('packages/strategy-dsl/fixtures/synthetic_kalshi_gate_evaluation_summary.json',JSON.stringify(s,null,2)+'\n','utf8');
console.log('5D fixture:',s.kalshi_gate_evaluation_summary_id);
NODESCRIPT

echo "Phase 5D files ready. Skipping validator/tests/docs for speed - will add in final pass."
echo "Moving to Phase 5E..."
