import { createHash } from "node:crypto";

/**
 * Produce a deterministic `kses_`-prefixed ID for a KalshiSignalEvaluationSummary.
 *
 * Inputs are joined with `|` and hashed with SHA-256.
 * The first 32 hex characters of the digest form the suffix.
 *
 * @param {{ signalDefinitionId: string, marketSnapshotId: string, evaluationMode: string, schemaVersion: string, conditionFamily: string }} params
 * @returns {string}  e.g. "kses_<32 hex chars>"
 */
export function kalshiSignalEvaluationSummaryId({
  signalDefinitionId,
  marketSnapshotId,
  evaluationMode,
  schemaVersion,
  conditionFamily,
}) {
  const digest = createHash("sha256")
    .update(
      [signalDefinitionId, marketSnapshotId, evaluationMode, schemaVersion, conditionFamily].join("|")
    )
    .digest("hex")
    .slice(0, 32);
  return `kses_${digest}`;
}
