/**
 * kalshi-confidence-gate-contract-id.js
 *
 * Phase 5A — Deterministic content-addressed ID for KalshiConfidenceGateContract.
 *
 * Prefix: kcgc_
 * Algorithm: SHA-256, first 32 hex chars
 * Inputs (pipe-joined): gate_contract_mode | schema_version | source_phase | overall_gate_status | required_gate_count
 *
 * No file I/O. No network. No credentials. No env. Paper-only. Offline-safe.
 */

import { createHash } from "node:crypto";

const SCHEMA_VERSION = "kalshi_confidence_gate_contract.v1";
const REQUIRED_GATE_COUNT = 5;

/**
 * @param {object} params
 * @param {string} params.gateContractMode
 * @param {string} params.sourcePhase
 * @param {string} params.overallGateStatus
 * @returns {string} kcgc_-prefixed deterministic ID
 */
export function kalshiConfidenceGateContractId({
  gateContractMode,
  sourcePhase,
  overallGateStatus,
}) {
  if (!gateContractMode || !sourcePhase || !overallGateStatus) {
    throw new Error(
      "kalshiConfidenceGateContractId: gateContractMode, sourcePhase, and overallGateStatus are required"
    );
  }
  const digest = createHash("sha256")
    .update(
      [
        gateContractMode,
        SCHEMA_VERSION,
        sourcePhase,
        overallGateStatus,
        String(REQUIRED_GATE_COUNT),
      ].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kcgc_${digest}`;
}
