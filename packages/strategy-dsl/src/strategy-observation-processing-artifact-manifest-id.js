import { createHash } from "node:crypto";

export function strategyObservationProcessingArtifactManifestId({
  strategyObservationProcessingContractId,
  strategyObservationProcessingInputSetId,
  artifactCount,
  hashCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationProcessingContractId,
      strategyObservationProcessingInputSetId,
      artifactCount,
      hashCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sopam_${digest}`;
}
