import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { replayEvidenceBundleId } from "./replay-evidence-bundle-id.js";
import { resolveLocalArtifactPath } from "./replay-artifact-reader.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "replay-engine", "fixtures", "synthetic_replay_evidence_bundle.json");
const requiredFields = [
  "replay_evidence_bundle_id",
  "schema_version",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "replay_mode",
  "source_replay_run_manifest_id",
  "source_replay_clock_id",
  "source_replay_read_plan_id",
  "source_replay_noop_run_summary_id",
  "source_manifest_path",
  "source_clock_path",
  "source_read_plan_path",
  "source_trace_path",
  "source_summary_path",
  "evidence_artifacts",
  "noop_run_totals",
  "consistency_checks",
  "status",
  "reason"
];
const requiredArtifactFields = ["artifact_type", "artifact_path", "schema_version", "record_count", "validation_command", "artifact_id"];
const requiredCheckFields = ["check_name", "status", "reason"];
const allowedArtifactTypes = new Set(["replay_run_manifest", "replay_clock", "replay_read_plan", "replay_trace", "replay_noop_run_summary"]);
const allowedCheckStatuses = new Set(["check_passed", "check_failed", "check_not_applicable"]);
const allowedStatuses = new Set(["evidence_bundle_ready", "evidence_bundle_rejected"]);
const forbiddenCommandPattern = /\b(curl|wget|fetch|powershell|pwsh|invoke-webrequest|invoke-restmethod|iwr|irm)\b|https?:\/\/|[|<>]/i;
const forbiddenReplayFields = new Set([
  "execute",
  "execution_plan",
  "strategy_score",
  "strategy_name",
  "bankroll_growth",
  "bankroll_allocation",
  "roi",
  "sharpe_ratio",
  "kelly_fraction",
  "model_score",
  "recommendation",
  "recommended_action",
  "live_trade_recommendation",
  "order",
  "order_id",
  "order_request",
  "trade_request"
]);

export async function validateReplayEvidenceBundleFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let bundle;
  try {
    bundle = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, (await validateReplayEvidenceBundle(bundle, options)).errors);
}

export async function validateReplayEvidenceBundle(bundle, options = {}) {
  const errors = [];
  const root = options.repoRoot ?? repoRoot;

  if (!bundle || typeof bundle !== "object" || Array.isArray(bundle)) {
    return { ok: false, errors: ["ReplayEvidenceBundle must be a JSON object"] };
  }
  validateForbiddenFields(errors, bundle);
  for (const field of requiredFields) {
    if (!Object.hasOwn(bundle, field)) {
      errors.push(`${field} is required`);
    }
  }
  if (bundle.schema_version !== "replay_evidence_bundle.v1") {
    errors.push("schema_version must be replay_evidence_bundle.v1");
  }
  if (Number.isNaN(Date.parse(bundle.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (bundle.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (bundle.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (bundle.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (bundle.replay_mode !== "offline_fixture_replay") {
    errors.push("replay_mode is invalid");
  }
  if (!allowedStatuses.has(bundle.status)) {
    errors.push("status is invalid");
  }
  validateDeterministicId(errors, bundle);
  await validateSourcePaths(errors, root, bundle);
  await validateEvidenceArtifacts(errors, root, bundle.evidence_artifacts);
  validateNoopTotals(errors, bundle.noop_run_totals, bundle.evidence_artifacts);
  validateConsistencyChecks(errors, bundle.consistency_checks, bundle.status);

  return { ok: errors.length === 0, errors };
}

export function formatReplayEvidenceBundleValidationReport(report) {
  const lines = [
    "Overlord ReplayEvidenceBundle Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function validateDeterministicId(errors, bundle) {
  const traceArtifact = Array.isArray(bundle.evidence_artifacts)
    ? bundle.evidence_artifacts.find((artifact) => artifact.artifact_type === "replay_trace")
    : null;
  const expected = replayEvidenceBundleId({
    manifestId: bundle.source_replay_run_manifest_id,
    clockId: bundle.source_replay_clock_id,
    readPlanId: bundle.source_replay_read_plan_id,
    traceCount: traceArtifact?.record_count,
    summaryId: bundle.source_replay_noop_run_summary_id
  });
  if (bundle.replay_evidence_bundle_id !== expected) {
    errors.push("replay_evidence_bundle_id must be deterministic from replay source ids and trace count");
  }
}

async function validateSourcePaths(errors, root, bundle) {
  for (const field of ["source_manifest_path", "source_clock_path", "source_read_plan_path", "source_trace_path", "source_summary_path"]) {
    await validateSafePath(errors, root, bundle[field], field);
  }
}

async function validateEvidenceArtifacts(errors, root, evidenceArtifacts) {
  if (!Array.isArray(evidenceArtifacts) || evidenceArtifacts.length === 0) {
    errors.push("evidence_artifacts must be a non-empty array");
    return;
  }
  const seenTypes = new Set();
  const seenPaths = new Set();
  for (const artifact of evidenceArtifacts) {
    if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) {
      errors.push("evidence_artifact must be an object");
      continue;
    }
    for (const field of requiredArtifactFields) {
      if (!Object.hasOwn(artifact, field)) {
        errors.push(`evidence_artifact ${field} is required`);
      }
    }
    if (!allowedArtifactTypes.has(artifact.artifact_type)) {
      errors.push("evidence artifact_type is invalid");
    }
    if (seenTypes.has(artifact.artifact_type)) {
      errors.push("duplicate evidence artifact_type is not allowed");
    }
    seenTypes.add(artifact.artifact_type);
    if (seenPaths.has(artifact.artifact_path)) {
      errors.push("duplicate evidence artifact_path is not allowed");
    }
    seenPaths.add(artifact.artifact_path);
    if (!Number.isInteger(artifact.record_count) || artifact.record_count < 0) {
      errors.push("evidence artifact record_count must be a non-negative integer");
    }
    if (!isSafeLocalNpmCommand(artifact.validation_command)) {
      errors.push("evidence artifact validation_command must be a local npm script");
    }
    await validateSafePath(errors, root, artifact.artifact_path, "evidence artifact_path");
    const actualRecordCount = await countArtifactRecords(errors, root, artifact.artifact_path);
    if (actualRecordCount !== null && Number.isInteger(artifact.record_count) && artifact.record_count !== actualRecordCount) {
      errors.push("evidence artifact record_count must match local fixture count");
    }
  }
}

function validateNoopTotals(errors, totals, evidenceArtifacts) {
  if (!totals || typeof totals !== "object" || Array.isArray(totals)) {
    errors.push("noop_run_totals must be an object");
    return;
  }
  for (const field of ["total_trace_records", "total_records_read", "total_artifacts_read"]) {
    if (!Number.isInteger(totals[field]) || totals[field] < 0) {
      errors.push(`noop_run_totals ${field} must be a non-negative integer`);
    }
  }
  const traceArtifact = Array.isArray(evidenceArtifacts)
    ? evidenceArtifacts.find((artifact) => artifact.artifact_type === "replay_trace")
    : null;
  if (traceArtifact && totals.total_trace_records !== traceArtifact.record_count) {
    errors.push("noop_run_totals total_trace_records must match replay_trace record_count");
  }
  if (Number.isInteger(totals.total_trace_records) && Number.isInteger(totals.total_records_read)) {
    if (totals.total_trace_records !== totals.total_records_read + 2) {
      errors.push("noop_run_totals total_trace_records must equal total_records_read plus boundary traces");
    }
  }
}

function validateConsistencyChecks(errors, checks, status) {
  if (!Array.isArray(checks) || checks.length === 0) {
    errors.push("consistency_checks must be a non-empty array");
    return;
  }
  const seenNames = new Set();
  for (const check of checks) {
    if (!check || typeof check !== "object" || Array.isArray(check)) {
      errors.push("consistency_check must be an object");
      continue;
    }
    for (const field of requiredCheckFields) {
      if (!Object.hasOwn(check, field)) {
        errors.push(`consistency_check ${field} is required`);
      }
    }
    if (seenNames.has(check.check_name)) {
      errors.push("duplicate consistency_check name is not allowed");
    }
    seenNames.add(check.check_name);
    if (!allowedCheckStatuses.has(check.status)) {
      errors.push("consistency_check status is invalid");
    }
  }
  if (status === "evidence_bundle_ready" && checks.some((check) => check.status === "check_failed")) {
    errors.push("ready evidence bundles must not contain failed consistency checks");
  }
}

async function validateSafePath(errors, root, artifactPath, label) {
  try {
    await resolveLocalArtifactPath(root, artifactPath);
  } catch (error) {
    errors.push(`${label} ${error.message}`);
  }
}

async function countArtifactRecords(errors, root, artifactPath) {
  try {
    const content = await readFile(path.join(root, artifactPath), "utf8");
    if (artifactPath.endsWith(".jsonl")) {
      return content.split(/\r?\n/u).filter((line) => line.trim().length > 0).length;
    }
    if (artifactPath.endsWith(".json")) {
      JSON.parse(content);
      return 1;
    }
    errors.push("evidence artifact_path must reference JSON or JSONL");
    return null;
  } catch (error) {
    errors.push(`evidence artifact record_count could not be verified: ${error.message}`);
    return null;
  }
}

function isSafeLocalNpmCommand(command) {
  return typeof command === "string" && command.startsWith("npm run ") && !forbiddenCommandPattern.test(command);
}

function validateForbiddenFields(errors, value, pathParts = []) {
  if (!value || typeof value !== "object") {
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => validateForbiddenFields(errors, entry, [...pathParts, String(index)]));
    return;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenReplayFields.has(key)) {
      const fieldPath = [...pathParts, key].join(".");
      errors.push(`forbidden execution, strategy, bankroll, model, or recommendation field is not allowed: ${fieldPath}`);
    }
    validateForbiddenFields(errors, nested, [...pathParts, key]);
  }
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validateReplayEvidenceBundleFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatReplayEvidenceBundleValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
