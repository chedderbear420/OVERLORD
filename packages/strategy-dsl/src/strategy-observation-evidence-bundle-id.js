import { createHash } from "node:crypto";

export function strategyObservationEvidenceBundleId({
  strategyObservationContractId,
  strategyObservationInputSetId,
  strategyObservationNoopSummaryId,
  strategyDryRunStackCloseoutCheckpointId,
  traceCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyObservationContractId,
      strategyObservationInputSetId,
      strategyObservationNoopSummaryId,
      strategyDryRunStackCloseoutCheckpointId,
      traceCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `soeb_${digest}`;
}
