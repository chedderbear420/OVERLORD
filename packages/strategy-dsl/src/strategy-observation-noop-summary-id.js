import { createHash } from "node:crypto";

export function strategyObservationNoopSummaryId({
  strategyObservationContractId,
  strategyObservationInputSetId,
  totalTraceRecords,
  totalInputsObserved
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationContractId,
      strategyObservationInputSetId,
      totalTraceRecords,
      totalInputsObserved
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sons_${digest}`;
}
