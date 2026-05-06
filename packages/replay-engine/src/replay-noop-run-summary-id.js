import { createHash } from "node:crypto";

export function replayNoopRunSummaryId(sourceReplayClockId, sourceReplayReadPlanId, totalTraceRecords) {
  return `rnrs_${digest(`${sourceReplayClockId}:${sourceReplayReadPlanId}:${totalTraceRecords}`)}`;
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}
