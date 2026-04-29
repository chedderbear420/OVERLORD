import { mkdir, open, stat } from "node:fs/promises";
import path from "node:path";
import { loadEventStoreSchemas } from "./schema-loader.js";
import { readSegmentRecords } from "./segment-reader.js";
import { validateEnvelopeRecords } from "./validate-fixtures.js";

export async function createAuditSegmentFile(auditSegmentPath) {
  await mkdir(path.dirname(auditSegmentPath), { recursive: true });
  const file = await open(auditSegmentPath, "wx");
  await file.close();
  return auditSegmentPath;
}

export async function appendAuditEnvelopesToSegment(options) {
  const auditSegmentPath = options.auditSegmentPath;
  const auditEnvelopes = options.auditEnvelopes ?? [];
  const repoRoot = options.repoRoot ?? path.resolve(path.dirname(auditSegmentPath), "..", "..", "..");
  const schemas = options.schemas ?? (await loadEventStoreSchemas(repoRoot));
  const existingRecords = await readExistingRecords(auditSegmentPath);
  const existingState = summarizeExistingRecords(existingRecords);
  const candidateRecords = auditEnvelopes.map((envelope, index) => ({
    lineNumber: existingRecords.length + index + 1,
    value: envelope
  }));
  const externalSubjectIds = new Set([
    ...existingState.subjectEventIds,
    ...auditEnvelopes
      .map((envelope) => envelope.payload?.subject_event_id)
      .filter((eventId) => typeof eventId === "string")
  ]);
  const errors = [];

  for (const { lineNumber, value: envelope } of candidateRecords) {
    if (envelope.event_type !== "audit_event" || envelope.payload_schema !== "audit_event.v1") {
      errors.push(`line ${lineNumber}: audit segment only accepts audit_event envelopes`);
    }
  }

  const validation = validateEnvelopeRecords(candidateRecords, {
    schemas,
    existingEventIds: existingState.eventIds,
    lastSequenceBySource: existingState.lastSequenceBySource,
    knownExternalAuditSubjectIds: externalSubjectIds
  });
  errors.push(...validation.errors);

  if (errors.length > 0) {
    return {
      ok: false,
      appended: 0,
      errors
    };
  }

  await mkdir(path.dirname(auditSegmentPath), { recursive: true });
  const file = await open(auditSegmentPath, "a");
  try {
    for (const envelope of auditEnvelopes) {
      await file.write(`${JSON.stringify(envelope)}\n`);
    }
  } finally {
    await file.close();
  }

  return {
    ok: true,
    appended: auditEnvelopes.length,
    errors: []
  };
}

async function readExistingRecords(auditSegmentPath) {
  try {
    await stat(auditSegmentPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return readSegmentRecords(auditSegmentPath);
}

function summarizeExistingRecords(records) {
  const eventIds = new Set();
  const subjectEventIds = new Set();
  const lastSequenceBySource = new Map();

  for (const { value } of records) {
    eventIds.add(value.event_id);
    if (value.payload?.subject_event_id) {
      subjectEventIds.add(value.payload.subject_event_id);
    }

    const source = value.source ?? "unknown";
    const previous = lastSequenceBySource.get(source);
    if (previous === undefined || value.sequence_id > previous) {
      lastSequenceBySource.set(source, value.sequence_id);
    }
  }

  return { eventIds, subjectEventIds, lastSequenceBySource };
}
