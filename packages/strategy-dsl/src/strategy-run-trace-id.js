import { createHash } from "node:crypto";

export function strategyRunTraceId(strategyRunIntentId, traceIndex, traceEventType, recordRef) {
  const digest = createHash("sha256")
    .update([strategyRunIntentId, traceIndex, traceEventType, recordRef].join("|"))
    .digest("hex")
    .slice(0, 32);
  return `srt_${digest}`;
}
