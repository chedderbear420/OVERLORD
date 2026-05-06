import { createHash } from "node:crypto";

export function strategyNoopRunSummaryId(strategyRunIntentId, totalTraceRecords, totalInputsObserved) {
  const digest = createHash("sha256")
    .update([strategyRunIntentId, totalTraceRecords, totalInputsObserved].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `sns_${digest}`;
}
