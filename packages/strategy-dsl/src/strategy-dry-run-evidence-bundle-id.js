import { createHash } from "node:crypto";

export function strategyDryRunEvidenceBundleId({
  strategyDryRunReadinessCheckpointId,
  strategyDryRunPlanId,
  strategyDryRunPlanEvidenceSummaryId,
  strategyDryRunNoopSummaryId,
  traceCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyDryRunReadinessCheckpointId,
      strategyDryRunPlanId,
      strategyDryRunPlanEvidenceSummaryId,
      strategyDryRunNoopSummaryId,
      traceCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdreb_${digest}`;
}
