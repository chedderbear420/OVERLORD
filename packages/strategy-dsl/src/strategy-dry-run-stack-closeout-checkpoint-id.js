import { createHash } from "node:crypto";

export function strategyDryRunStackCloseoutCheckpointId({
  strategyDefinitionId,
  strategyRunIntentId,
  strategyRunManifestId,
  strategyRunEvidenceBundleId,
  strategyDryRunPlanId,
  strategyDryRunPlanEvidenceSummaryId,
  strategyDryRunReadinessCheckpointId,
  strategyDryRunNoopSummaryId,
  strategyDryRunEvidenceBundleId,
  strategyDryRunCaseFileSummaryId,
  freezeRecommendation
}) {
  const digest = createHash("sha256")
    .update([
      strategyDefinitionId,
      strategyRunIntentId,
      strategyRunManifestId,
      strategyRunEvidenceBundleId,
      strategyDryRunPlanId,
      strategyDryRunPlanEvidenceSummaryId,
      strategyDryRunReadinessCheckpointId,
      strategyDryRunNoopSummaryId,
      strategyDryRunEvidenceBundleId,
      strategyDryRunCaseFileSummaryId,
      freezeRecommendation
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrscc_${digest}`;
}
