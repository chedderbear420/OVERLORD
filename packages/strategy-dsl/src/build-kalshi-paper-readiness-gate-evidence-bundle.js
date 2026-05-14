/**
 * build-kalshi-paper-readiness-gate-evidence-bundle.js
 *
 * Phase 5C — Builder for KalshiPaperReadinessGateEvidenceBundle.
 *
 * Pure function. No file I/O. No network. No credentials. No env.
 * No gate evaluation. No gate passing. No live approval.
 * All safety flags hardcoded under safety_flags. Paper-only. Offline-safe.
 *
 * Phase 5C indexes the upstream Phase 5A/5B evidence bundles and computes
 * conservative readiness checks for future paper-mode gate review.
 * It does NOT evaluate gates, pass gates, or enable any advanced/live mode.
 */

import { kalshiPaperReadinessGateEvidenceBundleId } from "./kalshi-paper-readiness-gate-evidence-bundle-id.js";

const SCHEMA_VERSION = "kalshi_paper_readiness_gate_evidence_bundle.v1";
const PHASE = "Phase 5C";
const BUNDLE_STATUS = "incomplete";
const REASON_CODE = "PAPER_READINESS_EVIDENCE_INDEXED_NOT_EVALUATED";
const REASON =
  "paper readiness evidence indexed; gates not evaluated; paper mode remains blocked";

export const UPSTREAM_SCHEMA_VERSIONS = {
  confidence_gate_contract: "kalshi_confidence_gate_contract.v1",
  research_review_evidence_bundle: "kalshi_research_review_evidence_bundle.v1",
};

export const defaultBundleOptions = {
  generatedAt: "2026-05-12T00:00:00Z",
};

/**
 * Infer which research artifact IDs were reviewed, split by type, from Phase 5B evidence items.
 */
function extractReviewedArtifacts(krrebFixture) {
  const researchArtifacts = new Set();
  const marketIngestArtifacts = new Set();
  const signalDefinitionArtifacts = new Set();
  const paperLedgerArtifacts = new Set();
  const replayArtifacts = new Set();

  for (const item of krrebFixture.evidence_items || []) {
    const aid = item.source_artifact_id;
    switch (item.evidence_type) {
      case "market_snapshot_fixture":
        marketIngestArtifacts.add(aid);
        break;
      case "strategy_signal_definition_fixture":
        signalDefinitionArtifacts.add(aid);
        researchArtifacts.add(aid);
        break;
      case "signal_evaluation_summary_fixture":
        researchArtifacts.add(aid);
        break;
      case "paper_ledger_entry_fixture":
        paperLedgerArtifacts.add(aid);
        break;
      case "confidence_gate_contract_fixture":
        // Not mapped to a reviewed artifact category
        break;
      default:
        replayArtifacts.add(aid);
    }
  }

  return {
    reviewed_research_artifacts: [...researchArtifacts].sort(),
    reviewed_market_ingest_artifacts: [...marketIngestArtifacts].sort(),
    reviewed_signal_definition_artifacts: [...signalDefinitionArtifacts].sort(),
    reviewed_paper_ledger_artifacts: [...paperLedgerArtifacts].sort(),
    reviewed_replay_artifacts: [...replayArtifacts].sort(),
  };
}

/**
 * Compute conservative readiness checks from Phase 5B evidence types present.
 */
function computeReadinessChecks(krrebFixture) {
  const types = new Set(
    (krrebFixture.evidence_items || []).map((i) => i.evidence_type)
  );

  return {
    signal_calibration_evidence_present:
      types.has("signal_evaluation_summary_fixture") &&
      types.has("paper_ledger_entry_fixture"),
    edge_consistency_evidence_present: false, // requires multi-market evidence, not yet present
    paper_pnl_evidence_present: types.has("paper_ledger_entry_fixture"),
    replay_evidence_present: false, // no replay evidence in Phase 5B
    market_ingest_evidence_present: types.has("market_snapshot_fixture"),
  };
}

/**
 * @param {object} cgcFixture - Phase 5A KalshiConfidenceGateContract fixture
 * @param {object} krrebFixture - Phase 5B KalshiResearchReviewEvidenceBundle fixture
 * @param {object} [options]
 * @param {string} [options.generatedAt]
 * @returns {object} KalshiPaperReadinessGateEvidenceBundle
 */
export function buildKalshiPaperReadinessGateEvidenceBundle(
  cgcFixture,
  krrebFixture,
  options = {}
) {
  const opts = { ...defaultBundleOptions, ...options };

  const cgcId = cgcFixture.kalshi_confidence_gate_contract_id;
  const krrebId = krrebFixture.kalshi_research_review_evidence_bundle_id;
  const upstreamBundleIds = [cgcId, krrebId];
  const upstreamBundleCount = upstreamBundleIds.length;

  const id = kalshiPaperReadinessGateEvidenceBundleId({
    phase: PHASE,
    status: BUNDLE_STATUS,
    upstreamBundleCount,
  });

  const reviewedArtifacts = extractReviewedArtifacts(krrebFixture);
  const readinessChecks = computeReadinessChecks(krrebFixture);

  return {
    kalshi_paper_readiness_gate_evidence_bundle_id: id,
    schema_version: SCHEMA_VERSION,
    generated_at: opts.generatedAt,
    phase: PHASE,
    bundle_status: BUNDLE_STATUS,
    upstream_evidence_bundle_ids: upstreamBundleIds,
    upstream_bundle_count: upstreamBundleCount,
    upstream_bundle_schema_versions: {
      confidence_gate_contract:
        UPSTREAM_SCHEMA_VERSIONS.confidence_gate_contract,
      research_review_evidence_bundle:
        UPSTREAM_SCHEMA_VERSIONS.research_review_evidence_bundle,
    },
    reviewed_research_artifacts: reviewedArtifacts.reviewed_research_artifacts,
    reviewed_market_ingest_artifacts:
      reviewedArtifacts.reviewed_market_ingest_artifacts,
    reviewed_signal_definition_artifacts:
      reviewedArtifacts.reviewed_signal_definition_artifacts,
    reviewed_paper_ledger_artifacts:
      reviewedArtifacts.reviewed_paper_ledger_artifacts,
    reviewed_replay_artifacts: reviewedArtifacts.reviewed_replay_artifacts,
    readiness_checks: readinessChecks,
    missing_evidence: [
      "risk_governor_review",
      "operator_signoff",
      "edge_consistency_evidence",
      "replay_evidence",
    ],
    blocking_issues: [
      "risk_governor_not_reviewed",
      "operator_signoff_not_complete",
    ],
    non_blocking_notes: [
      "signal_calibration_data_available_for_review",
      "paper_pnl_data_available_for_review",
      "market_ingest_data_available_for_review",
    ],
    safety_flags: {
      paper_only: true,
      live_execution_allowed: false,
      live_mode_allowed: false,
      order_placement_allowed: false,
      credentials_allowed: false,
      credential_access_allowed: false,
      autonomous_execution_allowed: false,
      gate_evaluation_allowed: false,
      gates_passed: false,
      phase_6_ready: false,
      operator_signoff_complete: false,
    },
    forbidden_capabilities: [
      "live_trading",
      "live_kalshi_api_calls",
      "order_placement",
      "credential_access",
      "api_keys",
      "autonomous_execution",
      "bankroll_sizing",
      "recommendations",
      "trading_decisions",
      "actionable_signals",
      "strategy_execution",
      "live_market_execution",
      "phase_6_readiness",
    ],
    allowed_outputs: [
      "evidence_index",
      "readiness_metadata",
      "offline_paper_observation_prep",
    ],
    forbidden_outputs: [
      "live_orders",
      "trade_signals",
      "bankroll_allocation",
      "credentials",
      "api_keys",
      "execution_commands",
    ],
    reason_code: REASON_CODE,
    reason: REASON,
  };
}
