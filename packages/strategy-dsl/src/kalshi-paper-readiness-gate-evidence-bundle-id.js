/**
 * kalshi-paper-readiness-gate-evidence-bundle-id.js
 *
 * Phase 5C — Deterministic content-addressed ID for KalshiPaperReadinessGateEvidenceBundle.
 *
 * Prefix: kprgeb_
 * Algorithm: SHA-256, first 32 hex chars
 * Inputs (pipe-joined):
 *   phase | schema_version | status | upstreamBundleCount
 *
 * No file I/O. No network. No credentials. No env. Paper-only. Offline-safe.
 */

import { createHash } from "node:crypto";

const SCHEMA_VERSION = "kalshi_paper_readiness_gate_evidence_bundle.v1";

/**
 * @param {object} params
 * @param {string} params.phase
 * @param {string} params.status
 * @param {number} params.upstreamBundleCount
 * @returns {string} kprgeb_-prefixed deterministic ID
 */
export function kalshiPaperReadinessGateEvidenceBundleId({
  phase,
  status,
  upstreamBundleCount,
}) {
  if (!phase || !status || upstreamBundleCount == null) {
    throw new Error(
      "kalshiPaperReadinessGateEvidenceBundleId: all inputs are required"
    );
  }
  const digest = createHash("sha256")
    .update(
      [
        phase,
        SCHEMA_VERSION,
        status,
        String(upstreamBundleCount),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kprgeb_${digest}`;
}
