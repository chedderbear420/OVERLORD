import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { buildStrategyObservationNoOpSummary, buildStrategyObservationTraces } from "./build-strategy-observation-trace.js";
import { validateStrategyObservationContract } from "./validate-strategy-observation-contract.js";
import { validateStrategyObservationInputSet } from "./validate-strategy-observation-input-set.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultObservationContractPath = "packages/strategy-dsl/fixtures/synthetic_strategy_observation_contract.json";
const defaultObservationInputSetPath = "packages/strategy-dsl/fixtures/synthetic_strategy_observation_input_set.json";

export async function runStrategyObservationNoop(options = {}) {
  const root = options.repoRoot ?? repoRoot;
  const observationContract = options.observationContract
    ?? await readJson(root, options.observationContractPath ?? defaultObservationContractPath);
  const observationInputSet = options.observationInputSet
    ?? await readJson(root, options.observationInputSetPath ?? defaultObservationInputSetPath);
  const generatedAt = options.generatedAt ?? observationContract.generated_at;

  await assertValidInputs(root, observationContract, observationInputSet);
  assertReadyInputs(observationContract, observationInputSet);
  assertLinkedInputs(observationContract, observationInputSet);

  const traces = buildStrategyObservationTraces({
    observationContract,
    observationInputSet,
    generatedAt
  });
  const summary = buildStrategyObservationNoOpSummary({
    observationContract,
    observationInputSet,
    traces,
    generatedAt
  });

  return { traces, summary };
}

async function assertValidInputs(root, observationContract, observationInputSet) {
  const contractReport = validateStrategyObservationContract(observationContract);
  const inputSetReport = await validateStrategyObservationInputSet(observationInputSet, { repoRoot: root });
  const errors = [
    ...contractReport.errors.map((error) => `strategy_observation_contract: ${error}`),
    ...inputSetReport.errors.map((error) => `strategy_observation_input_set: ${error}`)
  ];
  if (errors.length > 0) {
    throw new Error(`No-op strategy observation inputs are invalid:\n${errors.join("\n")}`);
  }
}

function assertReadyInputs(observationContract, observationInputSet) {
  if (observationContract.status !== "strategy_observation_contract_ready") {
    throw new Error("StrategyObservationContract is not ready");
  }
  if (observationInputSet.status !== "strategy_observation_input_set_ready") {
    throw new Error("StrategyObservationInputSet is not ready");
  }
}

function assertLinkedInputs(observationContract, observationInputSet) {
  if (observationContract.strategy_dry_run_stack_closeout_checkpoint_id !== observationInputSet.strategy_dry_run_stack_closeout_checkpoint_id) {
    throw new Error("StrategyObservationInputSet does not reference the supplied StrategyObservationContract closeout checkpoint");
  }
  if (observationContract.strategy_definition_id !== observationInputSet.source_strategy_definition_id) {
    throw new Error("StrategyObservationInputSet does not reference the supplied StrategyDefinition");
  }
  if (observationContract.strategy_run_intent_id !== observationInputSet.source_strategy_run_intent_id) {
    throw new Error("StrategyObservationInputSet does not reference the supplied StrategyRunIntent");
  }
  for (const artifact of observationInputSet.input_artifacts) {
    if (!observationContract.allowed_observation_inputs.includes(artifact.artifact_type)) {
      throw new Error("StrategyObservationInputSet includes an input not allowed by the StrategyObservationContract");
    }
  }
}

async function readJson(root, repoPath) {
  return JSON.parse(await readFile(path.join(root, repoPath), "utf8"));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const result = await runStrategyObservationNoop();
  console.log("Overlord No-Op Strategy Observation");
  console.log(`trace_records: ${result.traces.length}`);
  console.log(`summary_status: ${result.summary.status}`);
}
