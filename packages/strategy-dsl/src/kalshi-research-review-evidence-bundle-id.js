/**
 * kalshi-research-review-evidence-bundle-id.js
 *
 * Phase 5B — Deterministic content-addressed ID for KalshiResearchReviewEvidenceBundle.
 *
 * Prefix: krreb_
 * Algorithm: SHA-256, first 32 hex chars
 * Inputs (pipe-joined):
 *   evidence_bundle_mode | schema_version | source_phase | confidence_gate_contract_id | evidence_item_count
 *
 * No file I/O. No network. No credentials. No env. Paper-only. Offline-safe.
 */

import { createHash } from "node:crypto";

const SCHEMA_VERSION = "kalshi_research_review_evidence_bundle.v1";

/**
 * @param {object} params
 * @param {string} params.evidenceBundleMode
 * @param {string} params.sourcePhase
 * @param {string} params.confidenceGateContractId
 * @param {number} params.evidenceItemCount
 * @returns {string} krreb_-prefixed deterministic ID
 */
export function kalshiResearchReviewEvidenceBundleId({
  evidenceBundleMode,
  sourcePhase,
  confidenceGateContractId,
  evidenceItemCount,
}) {
  if (!evidenceBundleMode || !sourcePhase || !confidenceGateContractId || evidenceItemCount == null) {
    throw new Error(
      "kalshiResearchReviewEvidenceBundleId: all inputs are required"
    );
  }
  const digest = createHash("sha256")
    .update(
      [
        evidenceBundleMode,
        SCHEMA_VERSION,
        sourcePhase,
        confidenceGateContractId,
        String(evidenceItemCount),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `krreb_${digest}`;
}
