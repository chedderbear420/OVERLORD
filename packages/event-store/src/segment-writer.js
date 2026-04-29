import { mkdir, open, stat } from "node:fs/promises";
import path from "node:path";
import { buildAppendAuditEnvelope } from "./audit-events.js";
import { loadEventStoreSchemas } from "./schema-loader.js";
import { readSegmentRecords } from "./segment-reader.js";
import { validateEnvelopeRecords } from "./validate-fixtures.js";

export async function createSegmentFile(segmentPath) {
  await mkdir(path.dirname(segmentPath), { recursive: true });
  const file = await open(segmentPath, "wx");
  await file.close();
  return segmentPath;
}

export async function appendEnvelopesToSegment(options) {
  const segmentPath = options.segmentPath;
  const envelopes = options.envelopes ?? [];
  const repoRoot = options.repoRoot ?? path.resolve(path.dirname(segmentPath), "..", "..", "..");
  const schemas = options.schemas ?? (await loadEventStoreSchemas(repoRoot));
  const auditTimestamp = options.auditTimestamp ?? "1970-01-01T00:00:00Z";
  const existingRecords = await readExistingRecords(segmentPath);
  const existingState = summarizeExistingRecords(existingRecords);
  const candidateRecords = envelopes.map((envelope, index) => ({
    lineNumber: existingRecords.length + index + 1,
    value: envelope
  }));
  const validation = validateEnvelopeRecords(candidateRecords, {
    schemas,
    existingEventIds: existingState.eventIds,
    lastSequenceBySource: existingState.lastSequenceBySource
  });

  if (!validation.ok) {
    return {
      ok: false,
      appended: 0,
      errors: validation.errors,
      auditEvents: envelopes.map((envelope) =>
        buildAppendAuditEnvelope({
          subjectEnvelope: envelope,
          status: "rejected",
          reason: validation.errors.join("; "),
          capturedAt: auditTimestamp
        })
      )
    };
  }

  await mkdir(path.dirname(segmentPath), { recursive: true });
  const file = await open(segmentPath, "a");
  try {
    for (const envelope of envelopes) {
      await file.write(`${JSON.stringify(envelope)}\n`);
    }
  } finally {
    await file.close();
  }

  return {
    ok: true,
    appended: envelopes.length,
    errors: [],
    auditEvents: envelopes.map((envelope) =>
      buildAppendAuditEnvelope({
        subjectEnvelope: envelope,
        status: "accepted",
        reason: "Validated event envelope appended to local JSONL segment.",
        capturedAt: auditTimestamp
      })
    )
  };
}

async function readExistingRecords(segmentPath) {
  try {
    await stat(segmentPath);
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  return readSegmentRecords(segmentPath);
}

function summarizeExistingRecords(records) {
  const eventIds = new Set();
  const lastSequenceBySource = new Map();

  for (const { value } of records) {
    eventIds.add(value.event_id);
    const source = value.source ?? "unknown";
    const previous = lastSequenceBySource.get(source);
    if (previous === undefined || value.sequence_id > previous) {
      lastSequenceBySource.set(source, value.sequence_id);
    }
  }

  return { eventIds, lastSequenceBySource };
}
