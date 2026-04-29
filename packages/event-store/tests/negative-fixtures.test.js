import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateFixtureFile } from "../src/validate-fixtures.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const negativeFixtureDir = path.join(repoRoot, "packages", "event-store", "fixtures", "negative");

const negativeFixtures = [
  {
    file: "duplicate_event_id.jsonl",
    expected: "duplicate event_id evt_synth_000001"
  },
  {
    file: "bad_payload_schema.jsonl",
    expected: "unsupported payload_schema"
  },
  {
    file: "non_monotonic_sequence.jsonl",
    expected: "sequence_id must increase within source stream synthetic_fixture"
  },
  {
    file: "hash_mismatch.jsonl",
    expected: "payload_hash mismatch"
  },
  {
    file: "unknown_audit_reference.jsonl",
    expected: "audit subject_event_id evt_missing_999999 is not known or intentionally external"
  },
  {
    file: "non_synthetic_source.jsonl",
    expected: "fixture source must be synthetic_fixture"
  },
  {
    file: "malformed_jsonl.jsonl",
    expected: "Invalid JSONL at line 1"
  },
  {
    file: "id_mismatch.jsonl",
    expected: "envelope event_id must match payload event_id"
  },
  {
    file: "missing_provenance.jsonl",
    expected: "envelope: $.source is required"
  },
  {
    file: "bad_schema_version.jsonl",
    expected: "unsupported envelope schema_version"
  }
];

for (const fixture of negativeFixtures) {
  test(`${fixture.file} fails with expected validation message`, async () => {
    const report = await validateFixtureFile({
      fixturePath: path.join(negativeFixtureDir, fixture.file)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), new RegExp(escapeRegExp(fixture.expected)));
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
