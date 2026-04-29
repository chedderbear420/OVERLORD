import { actionDecisionId } from "./risk-decision-id.js";

export function buildActionDecision(riskDecision) {
  const approved = riskDecision.risk_status === "risk_approved";
  return {
    action_decision_id: actionDecisionId(riskDecision.risk_decision_id),
    schema_version: "action_decision.v1",
    source_risk_decision_id: riskDecision.risk_decision_id,
    source_signal_id: riskDecision.source_signal_id,
    source_state_id: riskDecision.source_state_id,
    source_event_id: riskDecision.source_event_id,
    source_payload_hash: riskDecision.source_payload_hash,
    market_id: riskDecision.market_id,
    captured_at: riskDecision.captured_at,
    received_at: riskDecision.received_at,
    action_status: approved ? "paper_candidate_allowed" : "rejected",
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    max_paper_exposure_cents: approved ? riskDecision.max_paper_exposure_cents : 0,
    reason: approved ? "Risk approved paper-only candidate. No trade created." : `No action: ${riskDecision.risk_reasons.join("; ")}`
  };
}
