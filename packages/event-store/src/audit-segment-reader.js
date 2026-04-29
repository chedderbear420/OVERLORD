import { readSegment } from "./segment-reader.js";

export async function readAuditSegment(auditSegmentPath) {
  const envelopes = await readSegment(auditSegmentPath);

  for (const [index, envelope] of envelopes.entries()) {
    if (envelope.event_type !== "audit_event" || envelope.payload_schema !== "audit_event.v1") {
      throw new Error(`Invalid audit segment record at line ${index + 1}: expected audit_event envelope`);
    }
  }

  return envelopes;
}
