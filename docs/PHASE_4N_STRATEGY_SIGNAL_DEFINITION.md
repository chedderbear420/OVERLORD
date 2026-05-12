# Phase 4N — Strategy Signal Definition

**Status:** ACTIVE  
**Branch:** `phase-4n-strategy-signal-definition`  
**Governing inputs:** Phase 4M `KalshiMarketSnapshot` (schema version `kalshi_market_snapshot.v1`)

---

## What this phase does

Phase 4N defines a **contract** for what a future Kalshi strategy signal definition is permitted to look like.

**It is a definition only.** It does not:
- Emit signal events
- Evaluate market data
- Produce picks, recommendations, or decisions
- Place, cancel, or modify orders
- Execute trades
- Write paper ledger entries
- Compute bankroll allocation, position sizing, expected value, or edge
- Access credentials, environment variables, API keys, or tokens
- Make network requests

**Phase 4O** is required before any evaluation can occur.  
**Phase 4P** is required before any paper ledger entries can be written.

---

## Deliverables

### Source files

| File | Description |
|------|-------------|
| `packages/strategy-dsl/src/kalshi-strategy-signal-definition-id.js` | Deterministic `kssd_`-prefixed ID from 5 definition fields |
| `packages/strategy-dsl/src/build-kalshi-strategy-signal-definition.js` | Canonical contract builder — hardcodes all safety flags |
| `packages/strategy-dsl/src/validate-kalshi-strategy-signal-definition.js` | Standalone validator with recursive forbidden-field and string-value scanners |

### Fixtures

| File | Description |
|------|-------------|
| `packages/strategy-dsl/fixtures/synthetic_kalshi_strategy_signal_definition.json` | Canonical contract fixture, ID `kssd_632d07fb70d0027b0656993db9586134` |

### Schema

| File | Description |
|------|-------------|
| `packages/strategy-dsl/schemas/kalshi_strategy_signal_definition.schema.json` | JSON Schema draft 2020-12, `additionalProperties: false`, all output flags `const: false` |

### Tests

| File | Tests | Result |
|------|-------|--------|
| `packages/strategy-dsl/tests/build-kalshi-strategy-signal-definition.test.js` | 5 | PASS |
| `packages/strategy-dsl/tests/kalshi-strategy-signal-definition-validation.test.js` | 25 | PASS |

### package.json scripts added

```
validate:kalshi-strategy-signal-definition
```

---

## Safety guarantees enforced

- `paper_only: true` — hardcoded in builder, rejected as false by validator
- `live_execution_allowed: false` — hardcoded, const false in schema
- `order_placement_allowed: false` — hardcoded, const false in schema
- `credentials_used: false` — hardcoded, const false in schema
- `network_request_used: false` — hardcoded, const false in schema
- `evaluation_allowed: false` — hardcoded; evaluation requires Phase 4O
- `output_contract.emits_signal_events: false` — const false in schema and validator
- `output_contract.emits_recommendations: false` — const false
- `output_contract.emits_decisions: false` — const false
- `output_contract.emits_orders: false` — const false
- `output_contract.emits_paper_ledger_entries: false` — const false
- `output_contract.evaluation_phase_required: "Phase 4O"` — const in schema
- `forbidden_outputs` must include all 13 required entries (`signal_event`, `pick`, `recommendation`, `decision`, `order`, `trade`, `execution`, `bankroll`, `position_size`, `expected_value`, `edge`, `pnl`, `paper_ledger_entry`)
- `allowed_input_fields` only from Phase 4M approved field list (11 fields)
- `threshold_definitions` only from approved names, value types, and comparisons
- Forbidden field names rejected recursively: `signal`, `signal_event`, `pick`, `recommendation`, `decision`, `order`, `trade`, `execution`, `bankroll`, `position_size`, `expected_value`, `edge`, `pnl`, `profit`, `buy`, `sell`, `bet`, `wager`, `stake`, `kelly`, `api_key`, `token`, `secret`, `credential`, `credentials`, `fetch`, `axios`, `websocket`, `polling`, `cron`
- Forbidden string values rejected in free-text fields: `buy`, `sell`, `place order`, `order`, `trade`, `execution`, `pick`, `recommendation`, `decision`, `bankroll`, `position size`, `expected value`, `edge`, `profit`, `pnl`, `api key`, `token`, `secret`, `credential`, `live execution`, `trading signal`, `generate signal`, `emit signal`, `buy signal`, `sell signal`
- `additionalProperties: false` — unknown fields rejected with `ERR_UNKNOWN_FIELD`

---

## Test run results

```
validate:kalshi-readonly-adapter-contract          PASS  0 errors
validate:kalshi-market-snapshot                    PASS  0 errors
validate:kalshi-strategy-signal-definition         PASS  0 errors
Phase 4N targeted tests (2 files)                 30/30 PASS
test:dashboard                                    39/39 PASS
test:dashboard-drift                              19/19 PASS
test:strategy-dsl                                 226/228, with 2 known pre-existing Windows CRLF
                                                  artifact-manifest hash failures unrelated to Phase 4N
```

### Pre-existing failures (not introduced by Phase 4N)

The following 2 tests fail on Windows due to `core.autocrlf` CRLF line-ending conversion affecting SHA-256 hashes stored in the artifact manifest fixture:

- `buildStrategyObservationProcessingArtifactManifest matches synthetic fixture`
- `synthetic StrategyObservationProcessingArtifactManifest fixture validates`

These failures exist on `main` before this branch and are unrelated to Phase 4N work.

---

## Architecture notes

- **ID inputs:** `definitionName|definitionVersion|sourceArtifactType|sourceSchemaVersion|definitionMode` — timestamp is never an ID input
- **No `validateObservationBoundary`:** The boundary guard rejects any field whose name contains `"credential"` (catches the required `credentials_used` field). Phase 4N uses `validateNoUnknownFields` against the explicit field whitelist instead.
- **Naming discipline:** "signal definition" appears only as a contract concept — in the ID prefix (`kssd_`), the schema title, the fixture filename, and the `definition_name` value (`market_snapshot_movement_condition_definition`). It is not used to mean an emitted signal object.

---

## Next phase

**Phase 4O — Signal Evaluation Pass**
