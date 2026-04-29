import { evaluateRiskChecks } from "./risk-checks.js";
import { riskDecisionId } from "./risk-decision-id.js";

export function buildRiskDecision(signal, policy) {
  const evaluation = evaluateRiskChecks(signal, policy);
  return {
    risk_decision_id: riskDecisionId(signal.signal_id, policy.policy_id),
    schema_version: "risk_decision.v1",
    source_signal_id: signal.signal_id,
    source_state_id: signal.source_state_id,
    source_event_id: signal.source_event_id,
    source_payload_hash: signal.source_payload_hash,
    market_id: signal.market_id,
    captured_at: signal.captured_at,
    received_at: signal.received_at,
    side: signal.side,
    observed_price: signal.observed_price,
    model_probability: signal.model_probability,
    net_edge: signal.net_edge,
    total_estimated_cost: evaluation.totalEstimatedCost ?? null,
    liquidity_status: signal.liquidity_status,
    staleness_status: signal.staleness_status,
    quality_flags: signal.quality_flags,
    risk_status: evaluation.status,
    risk_reasons: evaluation.reasons,
    policy_id: policy.policy_id,
    policy_version: policy.policy_version,
    max_paper_exposure_cents: policy.max_paper_exposure_cents
  };
}

export function buildRiskDecisions(signals, policy) {
  return signals.map((signal) => buildRiskDecision(signal, policy));
}
