import { createHash } from "node:crypto";

export function strategyObservationContractId({
  strategyDefinitionId,
  strategyRunIntentId,
  strategyDryRunStackCloseoutCheckpointId,
  allowedObservationInputCount,
  forbiddenObservationOutputCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyDefinitionId,
      strategyRunIntentId,
      strategyDryRunStackCloseoutCheckpointId,
      allowedObservationInputCount,
      forbiddenObservationOutputCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `soc_${digest}`;
}
