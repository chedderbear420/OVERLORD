import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { buildAppendAuditEnvelope } from "../src/audit-events.js";
import { readAuditSegment } from "../src/audit-segment-reader.js";
import { appendAuditEnvelopesToSegment } from "../src/audit-segment-writer.js";
import { readSegment } from "../src/segment-reader.js";
import { appendEnvelopesToSegment } from "../src/segment-writer.js";
import { loadPositiveEnvelopes, readText, repoRoot, withTempDir } from "./segment-test-helpers.js";

test("accepted market append can be traced to record_appended audit event", async () => {
  await withTempDir(async (dir) => {
    const [first] = await loadPositiveEnvelopes();
    const marketSegmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");
    const auditSegmentPath = path.join(dir, "audit-synthetic_fixture-2026-04-28.jsonl");
    const appendResult = await appendEnvelopesToSegment({
      segmentPath: marketSegmentPath,
      envelopes: [first],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });
    assert.equal(appendResult.ok, true);

    const auditResult = await appendAuditEnvelopesToSegment({
      auditSegmentPath,
      auditEnvelopes: appendResult.auditEvents,
      repoRoot
    });
    assert.equal(auditResult.ok, true);

    const marketRecords = await readSegment(marketSegmentPath);
    const auditRecords = await readAuditSegment(auditSegmentPath);
    assert.equal(marketRecords.length, 1);
    assert.equal(auditRecords.length, 1);
    assert.equal(auditRecords[0].payload.audit_action, "record_appended");
    assert.equal(auditRecords[0].payload.audit_status, "accepted");
    assert.equal(auditRecords[0].payload.subject_event_id, first.event_id);
  });
});

test("rejected market append can be traced without writing invalid record", async () => {
  await withTempDir(async (dir) => {
    const [first] = await loadPositiveEnvelopes();
    const invalid = structuredClone(first);
    invalid.payload_hash = "sha256:0000000000000000000000000000000000000000000000000000000000000000";
    const marketSegmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");
    const auditSegmentPath = path.join(dir, "audit-synthetic_fixture-2026-04-28.jsonl");
    const appendResult = await appendEnvelopesToSegment({
      segmentPath: marketSegmentPath,
      envelopes: [invalid],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });
    assert.equal(appendResult.ok, false);

    const auditResult = await appendAuditEnvelopesToSegment({
      auditSegmentPath,
      auditEnvelopes: appendResult.auditEvents,
      repoRoot
    });
    assert.equal(auditResult.ok, true);

    await assert.rejects(() => readSegment(marketSegmentPath), /ENOENT/);
    const auditRecords = await readAuditSegment(auditSegmentPath);
    assert.equal(auditRecords.length, 1);
    assert.equal(auditRecords[0].payload.audit_action, "record_rejected");
    assert.equal(auditRecords[0].payload.audit_status, "rejected");
    assert.equal(auditRecords[0].payload.subject_event_id, invalid.event_id);
    assert.match(auditRecords[0].payload.reason, /payload_hash mismatch/);
  });
});

test("audit segment append is append-only and separate from market segment", async () => {
  await withTempDir(async (dir) => {
    const [first, second] = await loadPositiveEnvelopes();
    const marketSegmentPath = path.join(dir, "synthetic_fixture-2026-04-28.jsonl");
    const auditSegmentPath = path.join(dir, "audit-synthetic_fixture-2026-04-28.jsonl");

    const marketAppend = await appendEnvelopesToSegment({
      segmentPath: marketSegmentPath,
      envelopes: [first],
      repoRoot,
      auditTimestamp: "2026-04-28T15:00:00Z"
    });
    await appendAuditEnvelopesToSegment({
      auditSegmentPath,
      auditEnvelopes: marketAppend.auditEvents,
      repoRoot
    });
    const marketBeforeAuditAppend = await readText(marketSegmentPath);
    const auditBefore = await readText(auditSegmentPath);

    const secondAudit = buildAppendAuditEnvelope({
      subjectEnvelope: second,
      status: "accepted",
      reason: "Validated event envelope appended to local JSONL segment.",
      capturedAt: "2026-04-28T15:00:01Z",
      sequenceId: 2
    });
    await appendAuditEnvelopesToSegment({
      auditSegmentPath,
      auditEnvelopes: [secondAudit],
      repoRoot
    });
    const marketAfterAuditAppend = await readText(marketSegmentPath);
    const auditAfter = await readText(auditSegmentPath);

    assert.equal(marketAfterAuditAppend, marketBeforeAuditAppend);
    assert.equal(auditAfter.startsWith(auditBefore), true);
    assert.equal(auditAfter.split(/\r?\n/).filter(Boolean).length, 2);
  });
});
