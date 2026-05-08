import { createHash } from "node:crypto";

export function strategyObservationInputSetId({
  strategyObservationContractId,
  strategyDryRunStackCloseoutCheckpointId,
  inputArtifactCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationContractId,
      strategyDryRunStackCloseoutCheckpointId,
      inputArtifactCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sois_${digest}`;
}
