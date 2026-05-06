import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
import { paperPerformanceSummaryId } from "./paper-performance-summary-id.js";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const defaultFixturePath = path.join(repoRoot, "packages", "paper-trader", "fixtures", "synthetic_paper_performance_summary.json");

const requiredFields = [
  "paper_performance_summary_id",
  "schema_version",
  "source_ledger_fixture",
  "source_exit_fixture",
  "ledger_record_count",
  "exit_record_count",
  "generated_at",
  "paper_only",
  "live_execution_allowed",
  "order_placement_allowed",
  "summary_type",
  "total_paper_entries",
  "total_paper_exits",
  "open_paper_entries",
  "closed_paper_entries",
  "rejected_paper_entries",
  "rejected_paper_exits",
  "total_entry_notional_cents",
  "total_exit_notional_cents",
  "total_gross_pnl_cents",
  "total_estimated_fees_cents",
  "total_net_pnl_cents",
  "winning_paper_exits",
  "losing_paper_exits",
  "flat_paper_exits",
  "status",
  "reason"
];

const forbiddenFields = [
  "roi",
  "roi_percent",
  "sharpe_ratio",
  "bankroll_growth",
  "kelly_fraction",
  "strategy_score",
  "model_score",
  "recommendation",
  "recommended_action",
  "allocation_cents",
  "live_trade_recommendation"
];

export async function validatePaperPerformanceSummaryFile(options = {}) {
  const filePath = options.filePath ?? defaultFixturePath;
  let summary;
  try {
    summary = JSON.parse(await readFile(filePath, "utf8"));
  } catch (error) {
    return makeReport(filePath, [error.message]);
  }
  return makeReport(filePath, validatePaperPerformanceSummary(summary).errors);
}

export function validatePaperPerformanceSummary(summary) {
  const errors = [];

  for (const field of requiredFields) {
    if (!Object.hasOwn(summary, field)) {
      errors.push(`${field} is required`);
    }
  }
  for (const field of forbiddenFields) {
    if (Object.hasOwn(summary, field)) {
      errors.push(`${field} is forbidden in PaperPerformanceSummary`);
    }
  }
  if (summary.schema_version !== "paper_performance_summary.v1") {
    errors.push("schema_version must be paper_performance_summary.v1");
  }
  if (summary.paper_performance_summary_id !== paperPerformanceSummaryId(summary.source_ledger_fixture, summary.source_exit_fixture, summary.generated_at)) {
    errors.push("paper_performance_summary_id must be deterministic from source fixtures and generated_at");
  }
  if (Number.isNaN(Date.parse(summary.generated_at))) {
    errors.push("generated_at must be a valid timestamp");
  }
  if (summary.paper_only !== true) {
    errors.push("paper_only must be true");
  }
  if (summary.live_execution_allowed !== false) {
    errors.push("live_execution_allowed must be false");
  }
  if (summary.order_placement_allowed !== false) {
    errors.push("order_placement_allowed must be false");
  }
  if (summary.summary_type !== "paper_accounting_summary") {
    errors.push("summary_type is invalid");
  }
  if (!["summary_ready", "summary_rejected"].includes(summary.status)) {
    errors.push("status is invalid");
  }
  for (const field of nonNegativeIntegerFields()) {
    if (!Number.isInteger(summary[field]) || summary[field] < 0) {
      errors.push(`${field} must be a non-negative integer`);
    }
  }
  for (const field of signedIntegerFields()) {
    if (!Number.isInteger(summary[field])) {
      errors.push(`${field} must be an integer`);
    }
  }
  if (Number.isInteger(summary.total_paper_entries) && Number.isInteger(summary.closed_paper_entries) && Number.isInteger(summary.open_paper_entries) && summary.open_paper_entries !== summary.total_paper_entries - summary.closed_paper_entries) {
    errors.push("open_paper_entries must equal total_paper_entries - closed_paper_entries");
  }
  if (Number.isInteger(summary.total_paper_entries) && Number.isInteger(summary.closed_paper_entries) && summary.closed_paper_entries > summary.total_paper_entries) {
    errors.push("closed_paper_entries must not exceed total_paper_entries");
  }
  if (Number.isInteger(summary.ledger_record_count) && Number.isInteger(summary.total_paper_entries) && Number.isInteger(summary.rejected_paper_entries) && summary.total_paper_entries + summary.rejected_paper_entries > summary.ledger_record_count) {
    errors.push("paper entry counts must not exceed ledger_record_count");
  }
  if (Number.isInteger(summary.exit_record_count) && Number.isInteger(summary.total_paper_exits) && Number.isInteger(summary.rejected_paper_exits) && summary.total_paper_exits + summary.rejected_paper_exits > summary.exit_record_count) {
    errors.push("paper exit counts must not exceed exit_record_count");
  }
  if (Number.isInteger(summary.total_gross_pnl_cents) && Number.isInteger(summary.total_estimated_fees_cents) && Number.isInteger(summary.total_net_pnl_cents) && summary.total_net_pnl_cents !== summary.total_gross_pnl_cents - summary.total_estimated_fees_cents) {
    errors.push("total_net_pnl_cents must equal total_gross_pnl_cents - total_estimated_fees_cents");
  }
  if (Number.isInteger(summary.total_paper_exits) && Number.isInteger(summary.winning_paper_exits) && Number.isInteger(summary.losing_paper_exits) && Number.isInteger(summary.flat_paper_exits) && summary.total_paper_exits !== summary.winning_paper_exits + summary.losing_paper_exits + summary.flat_paper_exits) {
    errors.push("exit outcome counts must sum to total_paper_exits");
  }

  return { ok: errors.length === 0, errors };
}

export function formatPaperPerformanceSummaryValidationReport(report) {
  const lines = [
    "Overlord PaperPerformanceSummary Validation",
    `fixture: ${report.filePath}`,
    `status: ${report.ok ? "PASS" : "FAIL"}`,
    `errors: ${report.errors.length}`
  ];
  for (const error of report.errors) {
    lines.push(`ERROR ${error}`);
  }
  return lines.join("\n");
}

function nonNegativeIntegerFields() {
  return [
    "ledger_record_count",
    "exit_record_count",
    "total_paper_entries",
    "total_paper_exits",
    "open_paper_entries",
    "closed_paper_entries",
    "rejected_paper_entries",
    "rejected_paper_exits",
    "total_entry_notional_cents",
    "total_exit_notional_cents",
    "total_estimated_fees_cents",
    "winning_paper_exits",
    "losing_paper_exits",
    "flat_paper_exits"
  ];
}

function signedIntegerFields() {
  return ["total_gross_pnl_cents", "total_net_pnl_cents"];
}

function makeReport(filePath, errors) {
  return {
    ok: errors.length === 0,
    filePath: path.relative(repoRoot, filePath).replaceAll("\\", "/"),
    errors
  };
}

if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const explicitPath = process.argv.find((arg) => arg.endsWith(".json"));
  const report = await validatePaperPerformanceSummaryFile({
    filePath: explicitPath ? path.resolve(explicitPath) : defaultFixturePath
  });
  console.log(formatPaperPerformanceSummaryValidationReport(report));
  process.exitCode = report.ok ? 0 : 1;
}
