import { sha256Payload } from "./hash.js";

export function buildAppendAuditEnvelope({ subjectEnvelope, status, reason, capturedAt }) {
  const auditAction = status === "accepted" ? "record_appended" : "record_rejected";
  const auditPayload = {
    event_id: auditEventId(auditAction, subjectEnvelope.event_id),
    correlation_id: subjectEnvelope.correlation_id,
    schema_version: "audit_event.v1",
    source: subjectEnvelope.source,
    captured_at: capturedAt,
    received_at: capturedAt,
    sequence_id: subjectEnvelope.sequence_id,
    subject_event_id: subjectEnvelope.event_id,
    audit_action: auditAction,
    audit_status: status,
    actor: "local_validator",
    reason,
    details: {
      subject_schema_version: subjectEnvelope.schema_version,
      subject_payload_schema: subjectEnvelope.payload_schema
    }
  };

  return {
    event_id: auditPayload.event_id,
    correlation_id: auditPayload.correlation_id,
    schema_version: "event_envelope.v1",
    event_type: "audit_event",
    source: auditPayload.source,
    captured_at: auditPayload.captured_at,
    received_at: auditPayload.received_at,
    sequence_id: auditPayload.sequence_id,
    payload_schema: "audit_event.v1",
    payload_hash: sha256Payload(auditPayload),
    payload: auditPayload
  };
}

function auditEventId(action, subjectEventId) {
  const safeSubject = String(subjectEventId ?? "unknown").replace(/[^A-Za-z0-9._:-]/g, "_");
  return `evt_audit_${action}_${safeSubject}`;
}
