import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { test } from "node:test";
import { validateKalshiPaperLedgerEntry } from "../src/validate-kalshi-paper-ledger-entry.js";

const repoRoot = path.resolve(import.meta.dirname, "..", "..", "..");

async function loadFixture(name) {
  const p = path.join(repoRoot, "packages", "strategy-dsl", "fixtures", name);
  return JSON.parse(await readFile(p, "utf8"));
}

// ─── Group 1: Valid fixture ───────────────────────────────────────────────────

// 1. Valid synthetic fixture passes all checks
test("valid synthetic fixture passes all checks", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry(fixture);
  assert.deepEqual(errors, []);
  assert.equal(ok, true);
});

// ─── Group 2: Required fields ─────────────────────────────────────────────────

// 2. Non-object input fails
test("non-object input fails", () => {
  const { ok, errors } = validateKalshiPaperLedgerEntry("not an object");
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("JSON object")));
});

// 3. Missing kalshi_paper_ledger_entry_id fails
test("missing kalshi_paper_ledger_entry_id fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { kalshi_paper_ledger_entry_id: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("kalshi_paper_ledger_entry_id")));
});

// 4. Missing paper_only fails
test("missing paper_only fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { paper_only: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_only")));
});

// 5. Missing paper_entry_price_cents fails
test("missing paper_entry_price_cents fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { paper_entry_price_cents: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_entry_price_cents")));
});

// 6. Missing research_summary fails
test("missing research_summary fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { research_summary: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("research_summary")));
});

// 7. Unknown field rejected
test("unknown field is rejected", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    unexpected_field: "should not be here",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("unexpected_field")));
});

// ─── Group 3: Core fields ─────────────────────────────────────────────────────

// 8. Wrong schema_version fails
test("wrong schema_version fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    schema_version: "kalshi_paper_ledger_entry.v0",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("schema_version")));
});

// 9. Wrong source_phase fails
test("wrong source_phase fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    source_phase: "Phase 4O",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("source_phase")));
});

// 10. Wrong ledger_mode fails
test("wrong ledger_mode fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    ledger_mode: "live_mode",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("ledger_mode")));
});

// 11. Wrong paper_accounting_mode fails
test("wrong paper_accounting_mode fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_accounting_mode: "multi_contract",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_accounting_mode")));
});

// 12. Wrong paper_contract_side fails
test("wrong paper_contract_side fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_contract_side: "no_contract",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_contract_side")));
});

// 13. Wrong ledger_entry_status fails
test("wrong ledger_entry_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    ledger_entry_status: "actionable",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("ledger_entry_status")));
});

// 14. Wrong data_quality_status fails
test("wrong data_quality_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    data_quality_status: "incomplete",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("data_quality_status")));
});

// ─── Group 4: Safety and emit flags ──────────────────────────────────────────

// 15. paper_only: false fails
test("paper_only: false fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, paper_only: false });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_only")));
});

// 16. live_execution_allowed: true fails
test("live_execution_allowed: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    live_execution_allowed: true,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("live_execution_allowed")));
});

// 17. order_placement_allowed: true fails
test("order_placement_allowed: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    order_placement_allowed: true,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("order_placement_allowed")));
});

// 18. emits_orders: true fails
test("emits_orders: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, emits_orders: true });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("emits_orders")));
});

// 19. emits_paper_ledger_entries: true fails
test("emits_paper_ledger_entries: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    emits_paper_ledger_entries: true,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("emits_paper_ledger_entries")));
});

// ─── Group 5: Deterministic ID ────────────────────────────────────────────────

// 20. Correct deterministic ID passes
test("correct deterministic ID passes validation", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok } = validateKalshiPaperLedgerEntry(fixture);
  assert.equal(ok, true);
});

// 21. Tampered ID fails
test("tampered kalshi_paper_ledger_entry_id fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    kalshi_paper_ledger_entry_id: "kple_" + "0".repeat(32),
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("deterministic")));
});

// ─── Group 6: Input artifact refs ────────────────────────────────────────────

// 22. Missing input_artifact_refs fails
test("missing input_artifact_refs fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { input_artifact_refs: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("input_artifact_refs")));
});

// 23. Wrong signal_evaluation_summary artifact_id fails
test("wrong input_artifact_refs.signal_evaluation_summary.artifact_id fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    input_artifact_refs: {
      ...fixture.input_artifact_refs,
      signal_evaluation_summary: {
        ...fixture.input_artifact_refs.signal_evaluation_summary,
        artifact_id: "kses_" + "a".repeat(32),
      },
    },
  });
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) =>
      e.includes("input_artifact_refs.signal_evaluation_summary.artifact_id")
    )
  );
});

// 24. Wrong market_snapshot artifact_id fails
test("wrong input_artifact_refs.market_snapshot.artifact_id fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    input_artifact_refs: {
      ...fixture.input_artifact_refs,
      market_snapshot: {
        ...fixture.input_artifact_refs.market_snapshot,
        artifact_id: "kms_" + "b".repeat(32),
      },
    },
  });
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) => e.includes("input_artifact_refs.market_snapshot.artifact_id"))
  );
});

// 25. Wrong schema_version in signal_evaluation_summary ref fails
test("wrong schema_version in input_artifact_refs.signal_evaluation_summary fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    input_artifact_refs: {
      ...fixture.input_artifact_refs,
      signal_evaluation_summary: {
        ...fixture.input_artifact_refs.signal_evaluation_summary,
        schema_version: "kalshi_signal_evaluation_summary.v0",
      },
    },
  });
  assert.equal(ok, false);
  assert.ok(
    errors.some((e) =>
      e.includes("input_artifact_refs.signal_evaluation_summary.schema_version")
    )
  );
});

// ─── Group 7: Paper economics ─────────────────────────────────────────────────

// 26. Valid PnL fields pass (entry=mark=53, unrealized=0, realized=null, fees=0, net=0)
test("valid PnL fields pass consistency checks", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry(fixture);
  assert.equal(ok, true);
  assert.deepEqual(errors, []);
});

// 27. Non-integer paper_entry_price_cents fails
test("non-integer paper_entry_price_cents fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_entry_price_cents: 53.5,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_entry_price_cents")));
});

// 28. Inconsistent paper_net_pnl_cents fails
test("inconsistent paper_net_pnl_cents fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_net_pnl_cents: 99, // should be unrealized (0) + fees (0) = 0
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_net_pnl_cents")));
});

// 29. paper_realized_pnl_cents non-null when unsettled fails
test("paper_realized_pnl_cents non-null when paper_settlement_status is unsettled fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_realized_pnl_cents: 10, // must be null when unsettled
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_realized_pnl_cents")));
});

// ─── Group 8: Research summary ────────────────────────────────────────────────

// 30. Consistent research summary passes
test("consistent research_summary passes", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok } = validateKalshiPaperLedgerEntry(fixture);
  assert.equal(ok, true);
});

// 31. research_summary.entry_recorded: false fails
test("research_summary.entry_recorded: false fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_summary: { ...fixture.research_summary, entry_recorded: false },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("entry_recorded")));
});

// 32. Wrong research_summary.settlement_complete fails
test("wrong research_summary.settlement_complete fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  // paper_settlement_status is "unsettled", so settlement_complete must be false
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_summary: { ...fixture.research_summary, settlement_complete: true },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("settlement_complete")));
});

// ─── Group 9: Forbidden fields ────────────────────────────────────────────────

// 33. Forbidden implementation field detected
test("forbidden implementation field is rejected", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, order: "buy 1 contract" });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("forbidden paper ledger entry field")));
});
