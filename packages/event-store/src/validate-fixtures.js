import path from "node:path";
import { fileURLToPath } from "node:url";
import { sha256Payload } from "./hash.js";
import { readJsonl } from "./jsonl.js";
import { loadEventStoreSchemas } from "./schema-loader.js";
import { validateJsonSchema } from "./schema-validator.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(
  repoRoot,
  "packages",
  "event-store",
  "fixtures",
  "synthetic_market_events.jsonl"
);

const expectedFixtureSource = "synthetic_fixture";
const knownExternalAuditSubjectIds = new Set();

export async function validateFixtureFile(options = {}) {
  const fixturePath = options.fixturePath ?? defaultFixturePath;
  const schemas = options.schemas ?? (await loadEventStoreSchemas(repoRoot));
  let records;
  try {
    records = await readJsonl(fixturePath);
  } catch (error) {
    return {
      ok: false,
      fixturePath: path.relative(repoRoot, fixturePath).replaceAll("\\", "/"),
      records: 0,
      errors: [error.message],
      warnings: []
    };
  }
  const errors = [];
  const warnings = [];
  const seenEventIds = new Set();
  const lastSequenceBySource = new Map();
  const envelopeSchema = schemas["event_envelope.v1"];

  for (const { lineNumber, value: envelope } of records) {
    addSchemaErrors(errors, lineNumber, "envelope", validateJsonSchema(envelope, envelopeSchema));

    if (envelope.schema_version !== "event_envelope.v1") {
      errors.push(formatIssue(lineNumber, `unsupported envelope schema_version ${JSON.stringify(envelope.schema_version)}`));
    }

    if (envelope.source !== expectedFixtureSource) {
      errors.push(formatIssue(lineNumber, `fixture source must be ${expectedFixtureSource}`));
    }

    if (seenEventIds.has(envelope.event_id)) {
      errors.push(formatIssue(lineNumber, `duplicate event_id ${envelope.event_id}`));
    } else {
      seenEventIds.add(envelope.event_id);
    }

    const streamKey = envelope.source ?? "unknown";
    const previousSequence = lastSequenceBySource.get(streamKey);
    if (previousSequence !== undefined && envelope.sequence_id <= previousSequence) {
      errors.push(formatIssue(lineNumber, `sequence_id must increase within source stream ${streamKey}`));
    }
    lastSequenceBySource.set(streamKey, envelope.sequence_id);

    if (!schemas[envelope.payload_schema]) {
      errors.push(formatIssue(lineNumber, `unsupported payload_schema ${JSON.stringify(envelope.payload_schema)}`));
      continue;
    }

    if (envelope.event_type === "market_event" && envelope.payload_schema !== "market_event.v1") {
      errors.push(formatIssue(lineNumber, "market_event envelope must declare market_event.v1 payload_schema"));
    }

    if (envelope.event_type === "audit_event" && envelope.payload_schema !== "audit_event.v1") {
      errors.push(formatIssue(lineNumber, "audit_event envelope must declare audit_event.v1 payload_schema"));
    }

    addSchemaErrors(
      errors,
      lineNumber,
      envelope.payload_schema,
      validateJsonSchema(envelope.payload, schemas[envelope.payload_schema])
    );

    validateEnvelopePayloadCompatibility(errors, lineNumber, envelope);
    validatePayloadHash(errors, lineNumber, envelope);
  }

  validateAuditReferences(errors, records, seenEventIds);

  return {
    ok: errors.length === 0,
    fixturePath: path.relative(repoRoot, fixturePath).replaceAll("\\", "/"),
    records: records.length,
    errors,
    warnings
  };
}

export function formatValidationReport(report) {
  const lines = [
    "Overlord Event Store Fixture Validation",
    `fixture: ${report.fixturePath}`,
    `records: ${report.records}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`,
    `warnings: ${report.warnings.length}`
  ];

  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }

  for (const warning of report.warnings) {
    lines.push(`WARN ${warning}`);
  }

  return lines.join("\n");
}

function validateEnvelopePayloadCompatibility(errors, lineNumber, envelope) {
  const payload = envelope.payload;
  if (!payload || typeof payload !== "object") {
    return;
  }

  for (const field of ["event_id", "correlation_id", "source", "captured_at", "received_at", "sequence_id"]) {
    if (payload[field] !== undefined && envelope[field] !== payload[field]) {
      errors.push(formatIssue(lineNumber, `envelope ${field} must match payload ${field}`));
    }
  }

  if (payload.schema_version !== envelope.payload_schema) {
    errors.push(formatIssue(lineNumber, "payload schema_version must match envelope payload_schema"));
  }
}

function validatePayloadHash(errors, lineNumber, envelope) {
  const expected = sha256Payload(envelope.payload);
  if (envelope.payload_hash !== expected) {
    errors.push(formatIssue(lineNumber, `payload_hash mismatch: expected ${expected}`));
  }
}

function validateAuditReferences(errors, records, seenEventIds) {
  for (const { lineNumber, value: envelope } of records) {
    if (envelope.payload_schema !== "audit_event.v1") {
      continue;
    }

    const subjectEventId = envelope.payload?.subject_event_id;
    if (
      subjectEventId &&
      !seenEventIds.has(subjectEventId) &&
      !knownExternalAuditSubjectIds.has(subjectEventId)
    ) {
      errors.push(formatIssue(lineNumber, `audit subject_event_id ${subjectEventId} is not known or intentionally external`));
    }
  }
}

function addSchemaErrors(errors, lineNumber, label, schemaErrors) {
  for (const schemaError of schemaErrors) {
    errors.push(formatIssue(lineNumber, `${label}: ${schemaError}`));
  }
}

function formatIssue(lineNumber, message) {
  return `line ${lineNumber}: ${message}`;
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const report = await validateFixtureFile({
    fixturePath: process.argv[2] ? path.resolve(process.argv[2]) : defaultFixturePath
  });
  console.log(formatValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
