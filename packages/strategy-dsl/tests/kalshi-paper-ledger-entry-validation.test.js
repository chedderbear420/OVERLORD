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

// 6. Missing research_notes fails
test("missing research_notes fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { research_notes: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("research_notes")));
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

// 13. Wrong paper_entry_status fails
test("wrong paper_entry_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_entry_status: "actionable",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_entry_status")));
});

// 14. Missing paper_entry_status fails
test("missing paper_entry_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { paper_entry_status: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_entry_status")));
});

// 15. Wrong paper_outcome_status fails
test("wrong paper_outcome_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_outcome_status: "settled_win",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_outcome_status")));
});

// 16. Missing paper_outcome_status fails
test("missing paper_outcome_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { paper_outcome_status: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_outcome_status")));
});

// 17. Wrong paper_settlement_status (not unsettled_fixture) fails
test("paper_settlement_status other than unsettled_fixture fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_settlement_status: "unsettled", // old value — must fail
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_settlement_status")));
});

// 18. Wrong condition_family fails
test("wrong condition_family fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    condition_family: "unknown_family",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("condition_family")));
});

// 19. Missing condition_family fails
test("missing condition_family fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { condition_family: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("condition_family")));
});

// 20. Missing event_ticker fails
test("missing event_ticker fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { event_ticker: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("event_ticker")));
});

// 21. Empty event_ticker fails
test("empty event_ticker fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, event_ticker: "" });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("event_ticker")));
});

// 22. paper_units other than 1 fails
test("paper_units other than 1 fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, paper_units: 2 });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_units")));
});

// 23. reason_code other than PAPER_LEDGER_ENTRY_RECORDED fails
test("wrong reason_code fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    reason_code: "LEDGER_ENTRY_RECORDED_NON_ACTIONABLE", // old value — must fail
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("reason_code")));
});

// ─── Group 4: Safety and emit flags ──────────────────────────────────────────

// 24. paper_only: false fails
test("paper_only: false fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, paper_only: false });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_only")));
});

// 25. live_execution_allowed: true fails
test("live_execution_allowed: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    live_execution_allowed: true,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("live_execution_allowed")));
});

// 26. order_placement_allowed: true fails
test("order_placement_allowed: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    order_placement_allowed: true,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("order_placement_allowed")));
});

// 27. emits_orders: true fails
test("emits_orders: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, emits_orders: true });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("emits_orders")));
});

// 28. emits_live_positions: true fails
test("emits_live_positions: true fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    emits_live_positions: true,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("emits_live_positions")));
});

// 29. emits_paper_ledger_entries: true fails
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

// 30. Correct deterministic ID passes
test("correct deterministic ID passes validation", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok } = validateKalshiPaperLedgerEntry(fixture);
  assert.equal(ok, true);
});

// 31. Tampered ID fails
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

// 32. Missing input_artifact_refs fails
test("missing input_artifact_refs fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { input_artifact_refs: _, ...rest } = fixture;
  const { ok, errors } = validateKalshiPaperLedgerEntry(rest);
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("input_artifact_refs")));
});

// 33. Wrong signal_evaluation_summary artifact_id fails
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

// 34. Wrong market_snapshot artifact_id fails
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

// ─── Group 7: Paper economics ─────────────────────────────────────────────────

// 35. Non-integer paper_entry_price_cents fails
test("non-integer paper_entry_price_cents fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_entry_price_cents: 53.5,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_entry_price_cents")));
});

// 36. Inconsistent paper_net_pnl_cents fails (must equal unrealized - fees)
test("inconsistent paper_net_pnl_cents fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  // unrealized=0, fees=0, expected net = 0 - 0 = 0; we set net to 5 → should fail
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_net_pnl_cents: 5,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_net_pnl_cents")));
});

// 37. Net PnL math uses unrealized minus fees (not plus fees)
test("net PnL consistency: unrealized - fees (not plus)", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  // unrealized=0, fees=0: net should be 0; if we use plus convention net=0 too; use non-zero fees to distinguish
  // Simulate: unrealized=5, fees=3 → correct net = 5-3 = 2; wrong-sign net = 5+3 = 8
  const { ok: okCorrect } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_mark_price_cents: 58,    // entry=53, so unrealized = 58-53 = 5
    paper_unrealized_pnl_cents: 5,
    paper_fees_cents: 3,
    paper_net_pnl_cents: 2,        // 5 - 3 = 2 (correct formula)
  });
  const { ok: okWrong } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_mark_price_cents: 58,
    paper_unrealized_pnl_cents: 5,
    paper_fees_cents: 3,
    paper_net_pnl_cents: 8,        // 5 + 3 = 8 (wrong formula — must fail)
  });
  assert.equal(okCorrect, true, "correct net (unrealized - fees) should pass");
  assert.equal(okWrong, false, "wrong net (unrealized + fees) should fail");
});

// 38. paper_realized_pnl_cents non-null fails
test("paper_realized_pnl_cents non-null fails for unsettled_fixture", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    paper_realized_pnl_cents: 10,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("paper_realized_pnl_cents")));
});

// ─── Group 8: Research notes ──────────────────────────────────────────────────

// 39. Valid research_notes object passes
test("valid research_notes object passes", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok } = validateKalshiPaperLedgerEntry(fixture);
  assert.equal(ok, true);
});

// 40. research_notes as a string fails
test("research_notes as a string fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_notes: "paper ledger observation",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("research_notes")));
});

// 41. Missing source_evaluation_status in research_notes fails
test("missing research_notes.source_evaluation_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { source_evaluation_status: _, ...rn } = fixture.research_notes;
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_notes: rn,
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("source_evaluation_status")));
});

// 42. Wrong source_evaluation_status fails
test("wrong research_notes.source_evaluation_status fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_notes: { ...fixture.research_notes, source_evaluation_status: "actionable" },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("source_evaluation_status")));
});

// 43. Wrong ledger_entry_scope fails
test("wrong research_notes.ledger_entry_scope fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_notes: { ...fixture.research_notes, ledger_entry_scope: "live_execution" },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("ledger_entry_scope")));
});

// 44. Wrong runtime_reference fails
test("wrong research_notes.runtime_reference fails", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_notes: { ...fixture.research_notes, runtime_reference: "kalshi_api" },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("runtime_reference")));
});

// 45. Unknown key in research_notes rejected
test("unknown key in research_notes is rejected", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    research_notes: { ...fixture.research_notes, extra_field: "unexpected" },
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("research_notes")));
});

// ─── Group 9: Safe structural field names ────────────────────────────────────

// 46. Approved structural paper_ field names do not false-positive on forbidden scanner
test("approved structural paper_ field names pass forbidden field scanner", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry(fixture);
  // Confirm none of the approved structural fields trigger the forbidden scanner
  const forbidden = errors.filter((e) => e.includes("forbidden paper ledger entry field"));
  assert.deepEqual(forbidden, []);
  assert.equal(ok, true);
});

// ─── Group 10: Forbidden fields ──────────────────────────────────────────────

// 47. Forbidden implementation field detected
test("forbidden implementation field is rejected", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({ ...fixture, order: "buy 1 contract" });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("forbidden paper ledger entry field")));
});

// 48. Forbidden string value in reason is rejected
test("forbidden string value in reason is rejected", async () => {
  const fixture = await loadFixture("synthetic_kalshi_paper_ledger_entry.json");
  const { ok, errors } = validateKalshiPaperLedgerEntry({
    ...fixture,
    reason: "buy signal detected",
  });
  assert.equal(ok, false);
  assert.ok(errors.some((e) => e.includes("forbidden paper ledger entry string value")));
});
