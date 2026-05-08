import { createHash } from "node:crypto";

export function strategyDryRunReadinessCheckpointId({
  strategyDefinitionId,
  strategyRunIntentId,
  strategyRunManifestId,
  strategyRunEvidenceBundleId,
  strategyDryRunPlanId,
  strategyDryRunPlanEvidenceSummaryId,
  readinessStatus,
  generatedAt
}) {
  const digest = createHash("sha256")
    .update([
      strategyDefinitionId,
      strategyRunIntentId,
      strategyRunManifestId,
      strategyRunEvidenceBundleId,
      strategyDryRunPlanId,
      strategyDryRunPlanEvidenceSummaryId,
      readinessStatus,
      generatedAt
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrpc_${digest}`;
}
