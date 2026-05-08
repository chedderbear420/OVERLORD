import { createHash } from "node:crypto";

export function strategyDryRunTraceId({
  strategyDryRunReadinessCheckpointId,
  traceIndex,
  traceEventType,
  plannedObservationStepType,
  observedArtifactRef
}) {
  const digest = createHash("sha256")
    .update([
      strategyDryRunReadinessCheckpointId,
      traceIndex,
      traceEventType,
      plannedObservationStepType,
      observedArtifactRef
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sdrt_${digest}`;
}
