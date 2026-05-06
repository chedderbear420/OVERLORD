import { createHash } from "node:crypto";

export function replayClockId(sourceReplayRunManifestId, clockEvents) {
  const eventPart = clockEvents
    .map((event) => `${event.record_time}:${event.artifact_type}:${event.record_id ?? event.record_ref}`)
    .join("__");
  return `rclk_${digest(`${sourceReplayRunManifestId}:${eventPart}`)}`;
}

function digest(value) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, 32);
}
