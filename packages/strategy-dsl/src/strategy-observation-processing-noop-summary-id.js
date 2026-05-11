import { createHash } from "node:crypto";

export function strategyObservationProcessingNoopSummaryId({
  strategyObservationProcessingContractId,
  strategyObservationProcessingInputSetId,
  totalTraceRecords,
  totalInputsObserved
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationProcessingContractId,
      strategyObservationProcessingInputSetId,
      totalTraceRecords,
      totalInputsObserved
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sopns_${digest}`;
}
