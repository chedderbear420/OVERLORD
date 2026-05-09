import { createHash } from "node:crypto";

export function strategyObservationStackCloseoutCheckpointId({
  strategyObservationContractId,
  strategyObservationInputSetId,
  strategyObservationNoopSummaryId,
  strategyObservationEvidenceBundleId,
  strategyObservationCaseFileSummaryId,
  strategyDryRunStackCloseoutCheckpointId,
  strategyDefinitionId,
  strategyRunIntentId,
  freezeRecommendation
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationContractId,
      strategyObservationInputSetId,
      strategyObservationNoopSummaryId,
      strategyObservationEvidenceBundleId,
      strategyObservationCaseFileSummaryId,
      strategyDryRunStackCloseoutCheckpointId,
      strategyDefinitionId,
      strategyRunIntentId,
      freezeRecommendation
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `soscc_${digest}`;
}
