import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateEdgeSignalFile } from "../src/validate-edge-signals.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const negativeDir = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "negative");

const cases = [
  {
    file: "malformed_edge_signal_jsonl.jsonl",
    expected: "Invalid JSONL at line 1"
  },
  {
    file: "missing_provenance.jsonl",
    expected: "source_payload_hash is required"
  },
  {
    file: "invalid_model_probability.jsonl",
    expected: "model_probability must be between 0 and 1"
  },
  {
    file: "bad_raw_edge_math.jsonl",
    expected: "raw_edge must equal model_probability * 100 - observed_price"
  },
  {
    file: "bad_net_edge_math.jsonl",
    expected: "net_edge must equal raw_edge minus all costs and penalties"
  },
  {
    file: "stale_signal_eligible.jsonl",
    expected: "stale signals must be rejected"
  },
  {
    file: "illiquid_signal_eligible.jsonl",
    expected: "illiquid signals must be rejected"
  },
  {
    file: "forbidden_paper_eligible_candidate.jsonl",
    expected: "paper_eligible_candidate is reserved until paper trading phase"
  },
  {
    file: "bad_signal_id.jsonl",
    expected: "signal_id must be deterministic from source_state_id, side, and model_id"
  },
  {
    file: "non_monotonic_signal_order.jsonl",
    expected: "received_at must be monotonic for signal fixture order"
  }
];

for (const item of cases) {
  test(`${item.file} fails with expected EdgeSignal validation message`, async () => {
    const report = await validateEdgeSignalFile({
      filePath: path.join(negativeDir, item.file)
    });

    assert.equal(report.ok, false);
    assert.match(report.errors.join("\n"), new RegExp(escapeRegExp(item.expected)));
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
