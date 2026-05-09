import { createHash } from "node:crypto";

export function strategyObservationTraceId({
  strategyObservationContractId,
  strategyObservationInputSetId,
  traceIndex,
  traceEventType,
  observedInputType,
  observedArtifactPath
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationContractId,
      strategyObservationInputSetId,
      traceIndex,
      traceEventType,
      observedInputType ?? "observation_boundary",
      observedArtifactPath ?? "observation_boundary"
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sot_${digest}`;
}
