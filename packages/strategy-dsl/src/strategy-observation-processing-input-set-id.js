import { createHash } from "node:crypto";

export function strategyObservationProcessingInputSetId({
  strategyObservationProcessingContractId,
  strategyObservationStackCloseoutCheckpointId,
  inputArtifactCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationProcessingContractId,
      strategyObservationStackCloseoutCheckpointId,
      inputArtifactCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sopis_${digest}`;
}
