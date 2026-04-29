import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { buildAppendAuditEnvelope } from "../src/audit-events.js";
import { readAuditSegment } from "../src/audit-segment-reader.js";
import { appendAuditEnvelopesToSegment, createAuditSegmentFile } from "../src/audit-segment-writer.js";
import { loadPositiveEnvelopes, repoRoot, withTempDir, writeText } from "./segment-test-helpers.js";

test("createAuditSegmentFile refuses to overwrite an existing audit segment", async () => {
  await withTempDir(async (dir) => {
    const auditSegmentPath = path.join(dir, "audit-synthetic_fixture-2026-04-28.jsonl");

    await createAuditSegmentFile(auditSegmentPath);
    await assert.rejects(() => createAuditSegmentFile(auditSegmentPath), /EEXIST/);
  });
});

test("audit segment writer persists validated audit envelopes only", async () => {
  await withTempDir(async (dir) => {
    const [first, second] = await loadPositiveEnvelopes();
    const auditSegmentPath = path.join(dir, "audit-synthetic_fixture-2026-04-28.jsonl");
    const auditEnvelopes = [
      buildAppendAuditEnvelope({
        subjectEnvelope: first,
        status: "accepted",
        reason: "Validated event envelope appended to local JSONL segment.",
        capturedAt: "2026-04-28T15:00:00Z",
        sequenceId: 1
      }),
      buildAppendAuditEnvelope({
        subjectEnvelope: second,
        status: "accepted",
        reason: "Validated event envelope appended to local JSONL segment.",
        capturedAt: "2026-04-28T15:00:01Z",
        sequenceId: 2
      })
    ];

    const result = await appendAuditEnvelopesToSegment({
      auditSegmentPath,
      auditEnvelopes,
      repoRoot
    });
    assert.equal(result.ok, true);
    assert.equal(result.appended, 2);

    const readBack = await readAuditSegment(auditSegmentPath);
    assert.deepEqual(
      readBack.map((envelope) => envelope.event_id),
      auditEnvelopes.map((envelope) => envelope.event_id)
    );
    assert.deepEqual(
      readBack.map((envelope) => envelope.payload.subject_event_id),
      [first.event_id, second.event_id]
    );
  });
});

test("audit segment writer rejects non-audit envelopes before writing", async () => {
  await withTempDir(async (dir) => {
    const [marketEnvelope] = await loadPositiveEnvelopes();
    const auditSegmentPath = path.join(dir, "audit-synthetic_fixture-2026-04-28.jsonl");
    const result = await appendAuditEnvelopesToSegment({
      auditSegmentPath,
      auditEnvelopes: [marketEnvelope],
      repoRoot
    });

    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), /audit segment only accepts audit_event envelopes/);
    await assert.rejects(() => readAuditSegment(auditSegmentPath), /ENOENT/);
  });
});

test("audit segment reader fails cleanly on malformed audit JSONL", async () => {
  await withTempDir(async (dir) => {
    const auditSegmentPath = path.join(dir, "audit-malformed.jsonl");
    await writeText(auditSegmentPath, "{\"event_id\":\"evt_bad\"\n");

    await assert.rejects(() => readAuditSegment(auditSegmentPath), /Invalid JSONL at line 1/);
  });
});

test("audit segment reader rejects market envelopes in audit segments", async () => {
  await withTempDir(async (dir) => {
    const [marketEnvelope] = await loadPositiveEnvelopes();
    const auditSegmentPath = path.join(dir, "audit-with-market.jsonl");
    await writeText(auditSegmentPath, `${JSON.stringify(marketEnvelope)}\n`);

    await assert.rejects(() => readAuditSegment(auditSegmentPath), /expected audit_event envelope/);
  });
});
