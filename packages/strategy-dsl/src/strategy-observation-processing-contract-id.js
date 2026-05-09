import { createHash } from "node:crypto";

export function strategyObservationProcessingContractId({
  strategyDefinitionId,
  strategyRunIntentId,
  strategyObservationStackCloseoutCheckpointId,
  allowedProcessingInputCount,
  allowedProcessingOutputCount,
  forbiddenProcessingOutputCount
}) {
  const digest = createHash("sha256")
    .update([
      strategyDefinitionId,
      strategyRunIntentId,
      strategyObservationStackCloseoutCheckpointId,
      allowedProcessingInputCount,
      allowedProcessingOutputCount,
      forbiddenProcessingOutputCount
    ].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sopc_${digest}`;
}
