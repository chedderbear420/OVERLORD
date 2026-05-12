# Phase 4M — Market Data Ingest & Fixture Format

**Status:** COMPLETE  
**Branch:** `phase-4m-market-data-ingest-fixture-format`  
**Governing contract:** `krac_8e72c258a5e00a78b7e45b50a8e4f47f` (Phase 4L KalshiReadonlyAdapterContract)

---

## Objective

Establish a local-only Kalshi market data ingest pipeline. No HTTP client, no credentials, no live network. Raw JSON fixtures are validated, mapped, and canonicalized into `KalshiMarketSnapshot` records with deterministic SHA-256 IDs.

---

## Deliverables

### Source files

| File | Description |
|------|-------------|
| `packages/strategy-dsl/src/kalshi-market-snapshot-id.js` | Deterministic `kms_`-prefixed ID from `sourceSystem\|marketTicker\|ingestMode\|schemaVersion` |
| `packages/strategy-dsl/src/build-kalshi-market-snapshot.js` | Canonical snapshot builder — hardcodes all safety flags, maps raw fields |
| `packages/strategy-dsl/src/ingest-kalshi-market-snapshot.js` | Ingest mapper — forbidden-field guard over builder |
| `packages/strategy-dsl/src/validate-kalshi-market-snapshot.js` | Standalone validator with forbidden field + string value scanners |

### Fixtures

| File | Description |
|------|-------------|
| `packages/strategy-dsl/fixtures/synthetic_kalshi_raw_market_snapshot.json` | Raw Kalshi-shaped fixture (Warriors vs Lakers NBA playoff market) |
| `packages/strategy-dsl/fixtures/synthetic_kalshi_market_snapshot.json` | Canonical snapshot output, ID `kms_a64e39e9a580e9065a5ecbef7baea712` |

### Schema

| File | Description |
|------|-------------|
| `packages/strategy-dsl/schemas/kalshi_market_snapshot.schema.json` | JSON Schema draft 2020-12, `additionalProperties: false`, 6 safety flags `const`-constrained |

### Tests

| File | Tests | Result |
|------|-------|--------|
| `packages/strategy-dsl/tests/build-kalshi-market-snapshot.test.js` | 5 | PASS |
| `packages/strategy-dsl/tests/ingest-kalshi-market-snapshot.test.js` | 14 | PASS |
| `packages/strategy-dsl/tests/kalshi-market-snapshot-validation.test.js` | 11 | PASS |

### package.json scripts added

```
validate:kalshi-market-snapshot
```

---

## Safety guarantees enforced

- `paper_only: true` — hardcoded in builder, rejected as false by validator
- `live_execution_allowed: false` — hardcoded in builder, rejected as true by validator
- `order_placement_allowed: false` — hardcoded in builder, rejected as true by validator
- `credentials_used: false` — hardcoded in builder, rejected as true by validator
- `authenticated_request_used: false` — hardcoded in builder, rejected as true by validator
- `network_request_used: false` — hardcoded in builder, rejected as true by validator
- `ingest_mode: "local_fixture_only"` — const in schema, rejected if absent or wrong
- `adapter_contract_id: "krac_8e72c258a5e00a78b7e45b50a8e4f47f"` — must reference Phase 4L contract
- Forbidden field names blocked (recursively, at any depth): `signal`, `signals`, `recommendation`, `recommendations`, `pick`, `picks`, `decision`, `decisions`, `edge`, `bankroll`, `kelly_fraction`, `order`, `orders`, `trade`, `trades`, `trading`, `execution`, `balance`, `portfolio`, `position`, `positions`, `account`, `accounts`, `api_key`, `token`, `credential`, `credentials`, `secret`, `fetch`, `axios`, `websocket`, `polling`, `cron` and others — full path reported (e.g. `metadata.api_key`)
- Forbidden string values blocked in all free-text fields (`title`, `reason`, `market_status`, `ingest_warnings` items): patterns including `place order`, `live execution`, `trading signal`, `api key`, `edge calculation`, and others
- No HTTP client imports in any 4M source file (enforced by static import test)
- `additionalProperties: false` — unknown fields rejected with `ERR_UNKNOWN_FIELD`

---

## Test run results

```
validate:kalshi-readonly-adapter-contract  PASS  0 errors
validate:kalshi-market-snapshot            PASS  0 errors
Phase 4M tests (3 files)                  30/30 PASS
test:dashboard                            39/39 PASS
test:dashboard-drift                      19/19 PASS
test:strategy-dsl                         194/196, with 2 known pre-existing Windows CRLF artifact-manifest hash failures unrelated to Phase 4M
```

### Pre-existing failures (not introduced by Phase 4M)

The following 2 tests fail on Windows due to `core.autocrlf` CRLF line-ending conversion affecting SHA-256 hashes stored in the artifact manifest fixture:

- `buildStrategyObservationProcessingArtifactManifest matches synthetic fixture`
- `synthetic StrategyObservationProcessingArtifactManifest fixture validates`

These failures exist on `main` before this branch and are unrelated to Phase 4M work.

---

## Architecture notes

- **Separation of concerns:** `build-kalshi-market-snapshot.js` is a pure, deterministic builder with no I/O. `ingest-kalshi-market-snapshot.js` adds the forbidden-field guard layer on top. `validate-kalshi-market-snapshot.js` is a standalone post-hoc verifier. Each can be tested independently.
- **Deterministic IDs:** `kms_` prefix + first 32 hex chars of SHA-256 of `"kalshi|{market_ticker}|local_fixture_only|kalshi_market_snapshot.v1"`. Timestamp is never part of the ID input, making IDs stable across re-runs.
- **No `validateObservationBoundary`:** The boundary guard rejects any field whose name contains `"credential"`, which would catch the required `credentials_used` field. Phase 4M uses `validateNoUnknownFields` against the explicit allowed-field set instead.

---

## Next phase

**Phase 4N — Strategy Signal Definition**
