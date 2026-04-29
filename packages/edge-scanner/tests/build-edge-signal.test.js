import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { readJsonl } from "../../event-store/src/jsonl.js";
import { buildEdgeSignal, buildEdgeSignals } from "../src/build-edge-signal.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const marketStatePath = path.join(repoRoot, "packages", "market-state-engine", "fixtures", "synthetic_market_states.jsonl");
const probabilityPath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_model_probabilities.jsonl");
const edgeSignalPath = path.join(repoRoot, "packages", "edge-scanner", "fixtures", "synthetic_edge_signals.jsonl");

test("buildEdgeSignals creates deterministic positive, negative, and zero signals", async () => {
  const marketStates = await loadJsonlValues(marketStatePath);
  const probabilities = await loadJsonlValues(probabilityPath);
  const expectedSignals = await loadJsonlValues(edgeSignalPath);

  assert.deepEqual(buildEdgeSignals({ marketStates, modelProbabilities: probabilities }), expectedSignals);
});

test("stale state is rejected even with positive math", async () => {
  const [marketState] = await loadJsonlValues(marketStatePath);
  const staleState = { ...marketState, staleness_status: "stale", quality_flags: ["stale"] };
  const signal = buildEdgeSignal({
    marketState: staleState,
    modelProbability: {
      model_id: "synth_model_stale",
      model_version: "v0.fixture",
      source_state_id: staleState.state_id,
      side: "YES",
      model_probability: 0.8,
      uncertainty: 0
    }
  });

  assert.equal(signal.edge_status, "rejected");
  assert.equal(signal.action_eligibility, "rejected");
  assert.match(signal.reason, /staleness_status/);
});

test("poor liquidity is rejected even with positive math", async () => {
  const [marketState] = await loadJsonlValues(marketStatePath);
  const thinState = { ...marketState, liquidity_status: "thin" };
  const signal = buildEdgeSignal({
    marketState: thinState,
    modelProbability: {
      model_id: "synth_model_thin",
      model_version: "v0.fixture",
      source_state_id: thinState.state_id,
      side: "YES",
      model_probability: 0.8,
      uncertainty: 0
    }
  });

  assert.equal(signal.edge_status, "rejected");
  assert.equal(signal.action_eligibility, "rejected");
  assert.match(signal.reason, /liquidity_status/);
});

test("invalid price math throws before building a signal", async () => {
  const [marketState] = await loadJsonlValues(marketStatePath);
  const badState = { ...marketState, best_yes_ask: 101 };

  assert.throws(() => buildEdgeSignal({
    marketState: badState,
    modelProbability: {
      model_id: "synth_model_bad",
      model_version: "v0.fixture",
      source_state_id: badState.state_id,
      side: "YES",
      model_probability: 0.8,
      uncertainty: 0
    }
  }), /best_yes_ask/);
});

async function loadJsonlValues(filePath) {
  const records = await readJsonl(filePath);
  return records.map((record) => record.value);
}
