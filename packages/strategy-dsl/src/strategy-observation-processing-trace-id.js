import { createHash } from "node:crypto";

export function strategyObservationProcessingTraceId({
  strategyObservationProcessingContractId,
  strategyObservationProcessingInputSetId,
  traceIndex,
  traceEventType,
  observedInputType,
  observedArtifactPath
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationProcessingContractId,
      strategyObservationProcessingInputSetId,
      traceIndex,
      traceEventType,
      observedInputType ?? "processing_boundary",
      observedArtifactPath ?? "processing_boundary"
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sopt_${digest}`;
}
