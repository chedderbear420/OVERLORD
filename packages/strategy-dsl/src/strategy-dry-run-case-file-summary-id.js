import { createHash } from "node:crypto";

export function strategyDryRunCaseFileSummaryId({
  strategyDryRunEvidenceBundleId,
  strategyDryRunReadinessCheckpointId,
  strategyDryRunPlanId,
  totalEvidenceArtifacts,
  totalTraceRecords,
  totalStepsObserved,
  consistencyStatus
}) {
  const digest = createHash("sha256")
    .update([
      strategyDryRunEvidenceBundleId,
      strategyDryRunReadinessCheckpointId,
      strategyDryRunPlanId,
      totalEvidenceArtifacts,
      totalTraceRecords,
      totalStepsObserved,
      consistencyStatus
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrcfs_${digest}`;
}
