/**
 * build-kalshi-research-review-evidence-bundle.js
 *
 * Phase 5B — Builder for KalshiResearchReviewEvidenceBundle.
 *
 * Pure function. No file I/O. No network. No credentials. No env.
 * No gate evaluation. No gate passing. No live approval.
 * All safety flags hardcoded. Paper-only. Offline-safe.
 *
 * Phase 5B indexes evidence artifacts and maps them to confidence gates
 * for future review. It does NOT evaluate gates, pass gates, or enable
 * any advanced/live mode.
 */

import { kalshiResearchReviewEvidenceBundleId } from "./kalshi-research-review-evidence-bundle-id.js";

const SCHEMA_VERSION = "kalshi_research_review_evidence_bundle.v1";
const EVIDENCE_BUNDLE_MODE = "phase_5b_evidence_bundle_only";
const SOURCE_PHASE = "Phase 5B";
const CGC_SCHEMA_VERSION = "kalshi_confidence_gate_contract.v1";

export const APPROVED_EVIDENCE_TYPES = new Set([
  "market_snapshot_fixture",
  "strategy_signal_definition_fixture",
  "signal_evaluation_summary_fixture",
  "paper_ledger_entry_fixture",
  "confidence_gate_contract_fixture",
]);

export const APPROVED_EVIDENCE_STATUSES = new Set([
  "indexed",
  "available_for_future_review",
  "not_evaluated",
]);

export const REQUIRED_GATE_IDS = [
  "signal_calibration",
  "edge_consistency",
  "paper_pnl",
  "risk_governor",
  "operator_signoff",
];

export const defaultBundleOptions = {
  generatedAt: "2026-05-12T00:00:00Z",
};

/**
 * Build evidence items from source artifacts.
 */
function buildEvidenceItems(confidenceGateContractFixture, sourceArtifacts) {
  const {
    marketSnapshot,
    strategySignalDefinition,
    signalEvaluationSummary,
    paperLedgerEntry,
  } = sourceArtifacts;

  return [
    {
      evidence_id: "ev_kms_001",
      evidence_type: "market_snapshot_fixture",
      source_artifact_key: "market_snapshot",
      source_artifact_id: marketSnapshot.kalshi_market_snapshot_id,
      source_schema_version: marketSnapshot.schema_version,
      supports_gate_ids: ["signal_calibration", "edge_consistency"],
      evidence_status: "indexed",
      review_scope: "phase_5b_indexing_only",
      summary: "market snapshot fixture indexed",
    },
    {
      evidence_id: "ev_ksd_001",
      evidence_type: "strategy_signal_definition_fixture",
      source_artifact_key: "strategy_signal_definition",
      source_artifact_id: strategySignalDefinition.kalshi_strategy_signal_definition_id,
      source_schema_version: strategySignalDefinition.schema_version,
      supports_gate_ids: ["signal_calibration", "edge_consistency"],
      evidence_status: "indexed",
      review_scope: "phase_5b_indexing_only",
      summary: "signal definition fixture indexed",
    },
    {
      evidence_id: "ev_ses_001",
      evidence_type: "signal_evaluation_summary_fixture",
      source_artifact_key: "signal_evaluation_summary",
      source_artifact_id: signalEvaluationSummary.kalshi_signal_evaluation_summary_id,
      source_schema_version: signalEvaluationSummary.schema_version,
      supports_gate_ids: ["signal_calibration", "edge_consistency"],
      evidence_status: "indexed",
      review_scope: "phase_5b_indexing_only",
      summary: "evaluation summary fixture indexed",
    },
    {
      evidence_id: "ev_ple_001",
      evidence_type: "paper_ledger_entry_fixture",
      source_artifact_key: "paper_ledger_entry",
      source_artifact_id: paperLedgerEntry.kalshi_paper_ledger_entry_id,
      source_schema_version: paperLedgerEntry.schema_version,
      supports_gate_ids: ["signal_calibration", "edge_consistency", "paper_pnl"],
      evidence_status: "indexed",
      review_scope: "phase_5b_indexing_only",
      summary: "paper ledger entry fixture indexed",
    },
    {
      evidence_id: "ev_cgc_001",
      evidence_type: "confidence_gate_contract_fixture",
      source_artifact_key: "confidence_gate_contract",
      source_artifact_id: confidenceGateContractFixture.kalshi_confidence_gate_contract_id,
      source_schema_version: confidenceGateContractFixture.schema_version,
      supports_gate_ids: [
        "signal_calibration",
        "edge_consistency",
        "paper_pnl",
        "risk_governor",
        "operator_signoff",
      ],
      evidence_status: "indexed",
      review_scope: "phase_5b_indexing_only",
      summary: "confidence gate contract fixture indexed",
    },
  ];
}

/**
 * Build gate evidence map.
 */
function buildGateEvidenceMap() {
  return {
    signal_calibration: {
      mapped_evidence_ids: ["ev_ses_001", "ev_ple_001"],
      evidence_status: "mapped_not_evaluated",
    },
    edge_consistency: {
      mapped_evidence_ids: ["ev_ses_001", "ev_ple_001"],
      evidence_status: "mapped_not_evaluated",
    },
    paper_pnl: {
      mapped_evidence_ids: ["ev_ple_001"],
      evidence_status: "mapped_not_evaluated",
    },
    risk_governor: {
      mapped_evidence_ids: [],
      evidence_status: "missing_future_evidence",
    },
    operator_signoff: {
      mapped_evidence_ids: [],
      evidence_status: "missing_future_evidence",
    },
  };
}

/**
 * @param {object} confidenceGateContractFixture - Phase 5A CGC fixture
 * @param {object} sourceArtifacts
 * @param {object} sourceArtifacts.marketSnapshot
 * @param {object} sourceArtifacts.strategySignalDefinition
 * @param {object} sourceArtifacts.signalEvaluationSummary
 * @param {object} sourceArtifacts.paperLedgerEntry
 * @param {object} [options]
 * @param {string} [options.generatedAt]
 * @returns {object} KalshiResearchReviewEvidenceBundle
 */
export function buildKalshiResearchReviewEvidenceBundle(
  confidenceGateContractFixture,
  sourceArtifacts,
  options = {}
) {
  const opts = { ...defaultBundleOptions, ...options };
  const evidenceItems = buildEvidenceItems(confidenceGateContractFixture, sourceArtifacts);
  const gateEvidenceMap = buildGateEvidenceMap();
  const cgcId = confidenceGateContractFixture.kalshi_confidence_gate_contract_id;

  const id = kalshiResearchReviewEvidenceBundleId({
    evidenceBundleMode: EVIDENCE_BUNDLE_MODE,
    sourcePhase: SOURCE_PHASE,
    confidenceGateContractId: cgcId,
    evidenceItemCount: evidenceItems.length,
  });

  const { marketSnapshot, strategySignalDefinition, signalEvaluationSummary, paperLedgerEntry } = sourceArtifacts;

  return {
    kalshi_research_review_evidence_bundle_id: id,
    schema_version: SCHEMA_VERSION,
    generated_at: opts.generatedAt,
    evidence_bundle_mode: EVIDENCE_BUNDLE_MODE,
    source_phase: SOURCE_PHASE,
    confidence_gate_contract_id: cgcId,
    confidence_gate_contract_schema_version: CGC_SCHEMA_VERSION,
    input_artifact_refs: {
      confidence_gate_contract: {
        artifact_id: cgcId,
        schema_version: CGC_SCHEMA_VERSION,
        required: true,
      },
      market_snapshot: {
        artifact_id: marketSnapshot.kalshi_market_snapshot_id,
        schema_version: marketSnapshot.schema_version,
        required: true,
      },
      strategy_signal_definition: {
        artifact_id: strategySignalDefinition.kalshi_strategy_signal_definition_id,
        schema_version: strategySignalDefinition.schema_version,
        required: true,
      },
      signal_evaluation_summary: {
        artifact_id: signalEvaluationSummary.kalshi_signal_evaluation_summary_id,
        schema_version: signalEvaluationSummary.schema_version,
        required: true,
      },
      paper_ledger_entry: {
        artifact_id: paperLedgerEntry.kalshi_paper_ledger_entry_id,
        schema_version: paperLedgerEntry.schema_version,
        required: true,
      },
    },
    evidence_items: evidenceItems,
    gate_evidence_map: gateEvidenceMap,
    bundle_status: "evidence_indexed_not_evaluated",
    review_status: "pending_gate_evaluation",
    gate_evaluation_allowed: false,
    gates_passed: false,
    phase_6_ready: false,
    live_mode_allowed: false,
    credentials_allowed: false,
    order_placement_allowed: false,
    autonomous_execution_allowed: false,
    operator_signoff_complete: false,
    paper_only: true,
    reason_code: "EVIDENCE_BUNDLE_INDEXED_NOT_EVALUATED",
    reason: "evidence bundle indexed; gates remain blocked",
  };
}
