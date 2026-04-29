import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { readSegment } from "../src/segment-reader.js";
import { createSegmentFile, appendEnvelopesToSegment } from "../src/segment-writer.js";
import { loadPositiveEnvelopes, repoRoot, withTempDir } from "./segment-test-helpers.js";

test("createSegmentFile refuses to overwrite an existing segment", async () => {
  await withTempDir(async (dir) => {
    const segmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");

    await createSegmentFile(segmentPath);
    await assert.rejects(() => createSegmentFile(segmentPath), /EEXIST/);
  });
});

test("appendEnvelopesToSegment validates before append and returns accepted audit events", async () => {
  await withTempDir(async (dir) => {
    const [first] = await loadPositiveEnvelopes();
    const segmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");
    const result = await appendEnvelopesToSegment({
      segmentPath,
      envelopes: [first],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });

    assert.equal(result.ok, true);
    assert.equal(result.appended, 1);
    assert.equal(result.auditEvents.length, 1);
    assert.equal(result.auditEvents[0].payload.audit_action, "record_appended");
    assert.equal(result.auditEvents[0].payload.audit_status, "accepted");
    assert.equal(result.auditEvents[0].payload.subject_event_id, first.event_id);
  });
});

test("appendEnvelopesToSegment rejects invalid envelopes before writing", async () => {
  await withTempDir(async (dir) => {
    const [first] = await loadPositiveEnvelopes();
    const invalid = structuredClone(first);
    invalid.payload_hash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    const segmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");
    const result = await appendEnvelopesToSegment({
      segmentPath,
      envelopes: [invalid],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });

    assert.equal(result.ok, false);
    assert.equal(result.appended, 0);
    assert.match(result.errors.join("\n"), /payload_hash mismatch/);
    assert.equal(result.auditEvents[0].payload.audit_action, "record_rejected");
    assert.equal(result.auditEvents[0].payload.audit_status, "rejected");
    await assert.rejects(() => readSegment(segmentPath), /ENOENT/);
  });
});
