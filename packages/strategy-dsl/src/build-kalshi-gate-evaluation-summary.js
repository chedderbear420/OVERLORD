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
