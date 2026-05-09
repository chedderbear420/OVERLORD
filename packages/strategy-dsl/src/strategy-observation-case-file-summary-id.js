import { createHash } from "node:crypto";

export function strategyObservationCaseFileSummaryId({
  strategyObservationEvidenceBundleId,
  strategyObservationContractId,
  strategyObservationInputSetId,
  totalEvidenceArtifacts,
  totalTraceRecords,
  totalInputsObserved,
  consistencyStatus
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationEvidenceBundleId,
      strategyObservationContractId,
      strategyObservationInputSetId,
      totalEvidenceArtifacts,
      totalTraceRecords,
      totalInputsObserved,
      consistencyStatus
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `socfs_${digest}`;
}
