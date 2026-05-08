import { createHash } from "node:crypto";

export function strategyDryRunNoopSummaryId({
  strategyDryRunReadinessCheckpointId,
  strategyDryRunPlanId,
  totalTraceRecords,
  totalStepsObserved,
  readinessStatus
}) {
  const digest = createHash("sha256")
    .update([
      strategyDryRunReadinessCheckpointId,
      strategyDryRunPlanId,
      totalTraceRecords,
      totalStepsObserved,
      readinessStatus
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrns_${digest}`;
}
