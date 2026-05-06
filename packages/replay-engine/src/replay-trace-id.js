import { createHash } from "node:crypto";

export function replayTraceId(sourceReplayClockId, traceIndex, traceEventType, recordRef) {
  return `rtrace_${digest(`${sourceReplayClockId}:${traceIndex}:${traceEventType}:${recordRef}`)}`;
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}
