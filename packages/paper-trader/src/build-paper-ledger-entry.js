import { paperLedgerEntryId } from "./paper-ledger-id.js";

export function buildPaperLedgerEntry(actionDecision, riskDecision) {
  validateActionDecisionForPaperLedger(actionDecision);
  validateRiskDecisionForPaperLedger(actionDecision, riskDecision);

  const paperEntryPrice = riskDecision.observed_price;
  const maxPaperExposureCents = actionDecision.max_paper_exposure_cents;
  const paperQuantity = Math.floor(maxPaperExposureCents / paperEntryPrice);
  const notionalCents = paperQuantity * paperEntryPrice;

  return {
    paper_ledger_entry_id: paperLedgerEntryId(actionDecision.action_decision_id),
    schema_version: "paper_ledger_entry.v1",
    source_action_decision_id: actionDecision.action_decision_id,
    source_risk_decision_id: actionDecision.source_risk_decision_id,
    source_signal_id: actionDecision.source_signal_id,
    source_state_id: actionDecision.source_state_id,
    source_event_id: actionDecision.source_event_id,
    source_payload_hash: actionDecision.source_payload_hash,
    market_id: actionDecision.market_id,
    captured_at: actionDecision.captured_at,
    received_at: actionDecision.received_at,
    paper_only: true,
    live_execution_allowed: false,
    order_placement_allowed: false,
    ledger_event_type: "paper_entry_recorded",
    side: riskDecision.side,
    paper_entry_price: paperEntryPrice,
    max_paper_exposure_cents: maxPaperExposureCents,
    paper_quantity: paperQuantity,
    notional_cents: notionalCents,
    status: "paper_open",
    reason: "Paper-only candidate entry recorded from approved ActionDecision. No real order created.",
    final_pnl_cents: null
  };
}

export function validateActionDecisionForPaperLedger(actionDecision) {
  if (actionDecision.action_status !== "paper_candidate_allowed") {
    throw new Error("action_status must be paper_candidate_allowed to create a paper ledger entry");
  }
  if (actionDecision.paper_only !== true) {
    throw new Error("paper_only must be true to create a paper ledger entry");
  }
  if (actionDecision.live_execution_allowed !== false) {
    throw new Error("live_execution_allowed must be false to create a paper ledger entry");
  }
  if (actionDecision.order_placement_allowed !== false) {
    throw new Error("order_placement_allowed must be false to create a paper ledger entry");
  }
  if (!Number.isInteger(actionDecision.max_paper_exposure_cents) || actionDecision.max_paper_exposure_cents <= 0) {
    throw new Error("max_paper_exposure_cents must be a positive integer to create a paper ledger entry");
  }
}

function validateRiskDecisionForPaperLedger(actionDecision, riskDecision) {
  if (!riskDecision) {
    throw new Error("matching RiskDecision is required to create a paper ledger entry");
  }
  if (riskDecision.risk_decision_id !== actionDecision.source_risk_decision_id) {
    throw new Error("RiskDecision id must match source_risk_decision_id");
  }
  if (riskDecision.risk_status !== "risk_approved") {
    throw new Error("RiskDecision must be risk_approved to create a paper ledger entry");
  }
  if (!["YES", "NO"].includes(riskDecision.side)) {
    throw new Error("RiskDecision side must be YES or NO");
  }
  if (!Number.isInteger(riskDecision.observed_price) || riskDecision.observed_price <= 0 || riskDecision.observed_price >= 100) {
    throw new Error("RiskDecision observed_price must be integer cents from 1 to 99");
  }
}
