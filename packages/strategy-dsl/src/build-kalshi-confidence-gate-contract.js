/**
 * build-kalshi-confidence-gate-contract.js
 *
 * Phase 5A — Builder for KalshiConfidenceGateContract.
 *
 * Pure function. No file I/O. No network. No credentials. No env.
 * All safety flags hardcoded. No gate passes. Paper-only. Offline-safe.
 *
 * This contract defines the confidence gates required before any future
 * restricted live mode can even be considered. Phase 5A defines gates only —
 * no gates are passed, no live mode is enabled.
 */

import { kalshiConfidenceGateContractId } from "./kalshi-confidence-gate-contract-id.js";

const SCHEMA_VERSION = "kalshi_confidence_gate_contract.v1";
const GATE_CONTRACT_MODE = "phase_5a_gate_contract_only";
const SOURCE_PHASE = "Phase 5A";
const OVERALL_GATE_STATUS = "blocked";

export const APPROVED_GATE_STATUSES = new Set([
  "blocked",
  "requires_evidence",
  "not_evaluated",
]);

export const REQUIRED_GATE_IDS = [
  "signal_calibration",
  "edge_consistency",
  "paper_pnl",
  "risk_governor",
  "operator_signoff",
];

export const REQUIRED_SOURCE_ARTIFACTS = {
  market_snapshot: {
    schema_version: "kalshi_market_snapshot.v1",
    required: true,
  },
  strategy_signal_definition: {
    schema_version: "kalshi_strategy_signal_definition.v1",
    required: true,
  },
  signal_evaluation_summary: {
    schema_version: "kalshi_signal_evaluation_summary.v1",
    required: true,
  },
  paper_ledger_entry: {
    schema_version: "kalshi_paper_ledger_entry.v1",
    required: true,
  },
};

function buildRequiredGates() {
  return [
    {
      gate_id: "signal_calibration",
      gate_name: "Signal Calibration Gate",
      gate_status: "requires_evidence",
      required_before_phase: "Phase 6",
      evidence_required: true,
      minimum_requirements: [
        "minimum_sample_size",
        "brier_score_required",
        "log_score_required",
        "calibration_curve_required",
      ],
      current_evidence_status: "not_evaluated",
      blocking_reason: "calibration evidence not yet evaluated",
    },
    {
      gate_id: "edge_consistency",
      gate_name: "Edge Consistency Gate",
      gate_status: "requires_evidence",
      required_before_phase: "Phase 6",
      evidence_required: true,
      minimum_requirements: [
        "fee_adjusted_positive_research_result_required",
        "multiple_market_conditions_required",
        "spread_liquidity_review_required",
      ],
      current_evidence_status: "not_evaluated",
      blocking_reason: "fee adjusted research consistency not yet evaluated",
    },
    {
      gate_id: "paper_pnl",
      gate_name: "Paper PnL Gate",
      gate_status: "requires_evidence",
      required_before_phase: "Phase 6",
      evidence_required: true,
      minimum_requirements: [
        "paper_ledger_sample_size_required",
        "paper_net_result_review_required",
        "drawdown_review_required",
      ],
      current_evidence_status: "not_evaluated",
      blocking_reason: "paper ledger evidence sample is insufficient",
    },
    {
      gate_id: "risk_governor",
      gate_name: "Risk Governor Gate",
      gate_status: "blocked",
      required_before_phase: "Phase 6",
      evidence_required: true,
      minimum_requirements: [
        "max_position_cap_required",
        "kill_switch_required",
        "loss_limit_required",
        "manual_review_required",
      ],
      current_evidence_status: "not_implemented",
      blocking_reason: "risk governor not implemented",
    },
    {
      gate_id: "operator_signoff",
      gate_name: "Operator Sign-off Gate",
      gate_status: "blocked",
      required_before_phase: "Phase 6",
      evidence_required: true,
      minimum_requirements: [
        "operator_review_required",
        "manual_approval_required",
        "audit_bundle_required",
      ],
      current_evidence_status: "not_completed",
      blocking_reason: "operator sign-off not completed",
    },
  ];
}

export const defaultContractOptions = {
  generatedAt: "2026-05-12T00:00:00Z",
};

/**
 * @param {object} [options]
 * @param {string} [options.generatedAt] - ISO 8601 timestamp (default: 2026-05-12T00:00:00Z)
 * @returns {object} KalshiConfidenceGateContract
 */
export function buildKalshiConfidenceGateContract(options = {}) {
  const opts = { ...defaultContractOptions, ...options };

  const gates = buildRequiredGates();

  const id = kalshiConfidenceGateContractId({
    gateContractMode: GATE_CONTRACT_MODE,
    sourcePhase: SOURCE_PHASE,
    overallGateStatus: OVERALL_GATE_STATUS,
  });

  return {
    kalshi_confidence_gate_contract_id: id,
    schema_version: SCHEMA_VERSION,
    generated_at: opts.generatedAt,
    gate_contract_mode: GATE_CONTRACT_MODE,
    source_phase: SOURCE_PHASE,
    required_source_artifacts: REQUIRED_SOURCE_ARTIFACTS,
    gates,
    overall_gate_status: OVERALL_GATE_STATUS,
    phase_6_ready: false,
    live_mode_allowed: false,
    credentials_allowed: false,
    order_placement_allowed: false,
    autonomous_execution_allowed: false,
    risk_governor_required: true,
    operator_signoff_required: true,
    operator_signoff_complete: false,
    paper_only: true,
    reason_code: "CONFIDENCE_GATES_DEFINED_BLOCKED",
    reason: "confidence gate contract defined; advanced mode remains blocked",
  };
}
