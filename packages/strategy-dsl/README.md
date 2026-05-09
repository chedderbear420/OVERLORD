# packages/strategy-dsl

Strictly offline Strategy DSL contract package.

Phase 2A defines metadata-only StrategyDefinition and StrategyRunIntent records. These records describe future strategy shape and replay attachment intent, but they do not execute strategy logic, generate signals, create decisions, create paper ledger entries, create exits, calculate analytics, recommend trades, connect to Kalshi, or place orders.

Phase 2B adds negative fixture hardening for malformed, unsafe, executable, live-capable, credential-like, recommendation-like, bankroll-like, and invalid strategy contract metadata.

Phase 2C adds an offline no-op StrategyRunTrace shell. It observes validated replay trace metadata and emits strategy-run trace metadata only; it does not execute strategy logic or create signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2D adds negative fixture hardening for StrategyRunTrace and StrategyNoOpRunSummary malformed, unsafe, inconsistent, unordered, duplicated, executable, signal-like, decision-like, order-like, recommendation-like, and bankroll-like records.

Phase 2E adds StrategyRunManifest and StrategyRunEvidenceBundle metadata for the no-op strategy run. These records inventory and prove local strategy-run artifacts only; they do not execute strategy logic or create signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2F adds negative fixture hardening for StrategyRunManifest and StrategyRunEvidenceBundle malformed, unsafe, inconsistent, duplicated, missing, executable, signal-like, decision-like, order-like, recommendation-like, and bankroll-like records.

Phase 2G adds the StrategyDryRunPlan contract. It defines what a future offline dry-run would be allowed to read and what it is forbidden to produce, but it does not execute strategy logic or create signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2H adds negative fixture hardening for malformed, unsafe, invalid, non-read-only, executable, signal-like, decision-like, order-like, recommendation-like, and bankroll-like StrategyDryRunPlan records.

Phase 2I adds StrategyDryRunPlanEvidenceSummary metadata. It inventories the validated StrategyDryRunPlan and its count/safety outcome without executing strategy logic or producing signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2J adds negative fixture hardening for malformed, unsafe, inconsistent, mismatched, executable, signal-like, decision-like, order-like, recommendation-like, credential-like, and bankroll-like StrategyDryRunPlanEvidenceSummary records.

Phase 2K adds StrategyDryRunReadinessCheckpoint metadata. It inventories the validated strategy dry-run prerequisite stack and records whether it is ready for a future offline dry-run shell without executing strategy logic or producing signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2L adds negative fixture hardening for malformed, unsafe, inconsistent, incomplete, executable, signal-like, decision-like, order-like, recommendation-like, credential-like, analytics-like, and bankroll-like StrategyDryRunReadinessCheckpoint records.

Phase 2M adds an offline StrategyDryRunTrace no-op shell. It consumes the validated dry-run readiness checkpoint and dry-run plan, walks metadata-only observation steps, and emits dry-run trace and summary metadata only without executing strategy logic or producing signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2N adds negative fixture hardening for malformed, unsafe, inconsistent, unordered, duplicated, lifecycle-invalid, executable, signal-like, decision-like, order-like, recommendation-like, credential-like, live-capable, and bankroll-like StrategyDryRunTrace and StrategyDryRunNoOpSummary records.

Phase 2O adds StrategyDryRunEvidenceBundle and StrategyDryRunCaseFileSummary metadata. These records inventory the validated no-op dry-run artifacts and final case-file totals without executing strategy logic or producing signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2P adds negative fixture hardening for malformed, unsafe, inconsistent, duplicated, incomplete, executable, signal-like, decision-like, order-like, recommendation-like, credential-like, analytics-like, and bankroll-like StrategyDryRunEvidenceBundle and StrategyDryRunCaseFileSummary records.

Phase 2Q adds StrategyDryRunStackCloseoutCheckpoint metadata. It inventories the full validated Phase 2 dry-run metadata stack and records freeze-readiness for the metadata stack only; it does not execute strategy logic or produce signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 2R adds negative fixture hardening for malformed, unsafe, inconsistent, incomplete, duplicated, executable, signal-like, decision-like, order-like, recommendation-like, credential-like, analytics-like, and bankroll-like StrategyDryRunStackCloseoutCheckpoint records.

Phase 3A adds StrategyObservationContract and StrategyObservationInputSet metadata. These records consume the frozen Phase 2 dry-run metadata stack as immutable input and define what a future offline observation pass may inspect, but they do not execute strategy logic or produce signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 3B adds negative fixture hardening for malformed, unsafe, inconsistent, executable, live-capable, signal-like, decision-like, order-like, recommendation-like, bankroll-like, analytics-like, credential-like, and path-unsafe StrategyObservationContract and StrategyObservationInputSet records.

Phase 3C adds an offline StrategyObservationTrace no-op shell. It consumes validated StrategyObservationContract and StrategyObservationInputSet records, walks approved read-only inputs, and emits observation trace and no-op summary metadata only without executing strategy logic or producing signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 3D adds negative fixture hardening for malformed, unsafe, inconsistent, unordered, duplicated, lifecycle-invalid, executable, live-capable, signal-like, decision-like, order-like, recommendation-like, bankroll-like, analytics-like, credential-like, and path-unsafe StrategyObservationTrace and StrategyObservationNoOpSummary records.

Phase 3E adds StrategyObservationEvidenceBundle and StrategyObservationCaseFileSummary metadata. These records inventory the validated no-op observation artifacts and final observation case-file totals without executing strategy logic or producing signals, decisions, trades, recommendations, analytics, or bankroll actions.

Phase 3F adds negative fixture hardening for malformed, unsafe, inconsistent, incomplete, duplicated, live-capable, executable, signal-like, decision-like, order-like, recommendation-like, bankroll-like, credential-like, analytics-like, and path-unsafe StrategyObservationEvidenceBundle and StrategyObservationCaseFileSummary records.

Phase 3G adds StrategyObservationStackCloseoutCheckpoint metadata. It inventories the full validated Phase 3 observation metadata stack and records freeze-readiness for the metadata stack only; it does not execute strategy logic or produce signals, decisions, trades, recommendations, analytics, or bankroll actions.

## Files

- `schemas/strategy_definition.schema.json`: StrategyDefinition schema.
- `schemas/strategy_run_intent.schema.json`: StrategyRunIntent schema.
- `schemas/strategy_run_trace.schema.json`: StrategyRunTrace schema.
- `schemas/strategy_noop_run_summary.schema.json`: StrategyNoOpRunSummary schema.
- `schemas/strategy_run_manifest.schema.json`: StrategyRunManifest schema.
- `schemas/strategy_run_evidence_bundle.schema.json`: StrategyRunEvidenceBundle schema.
- `schemas/strategy_dry_run_plan.schema.json`: StrategyDryRunPlan schema.
- `schemas/strategy_dry_run_plan_evidence_summary.schema.json`: StrategyDryRunPlanEvidenceSummary schema.
- `schemas/strategy_dry_run_readiness_checkpoint.schema.json`: StrategyDryRunReadinessCheckpoint schema.
- `schemas/strategy_dry_run_trace.schema.json`: StrategyDryRunTrace schema.
- `schemas/strategy_dry_run_noop_summary.schema.json`: StrategyDryRunNoOpSummary schema.
- `schemas/strategy_dry_run_evidence_bundle.schema.json`: StrategyDryRunEvidenceBundle schema.
- `schemas/strategy_dry_run_case_file_summary.schema.json`: StrategyDryRunCaseFileSummary schema.
- `schemas/strategy_dry_run_stack_closeout_checkpoint.schema.json`: StrategyDryRunStackCloseoutCheckpoint schema.
- `schemas/strategy_observation_contract.schema.json`: StrategyObservationContract schema.
- `schemas/strategy_observation_input_set.schema.json`: StrategyObservationInputSet schema.
- `schemas/strategy_observation_trace.schema.json`: StrategyObservationTrace schema.
- `schemas/strategy_observation_noop_summary.schema.json`: StrategyObservationNoOpSummary schema.
- `schemas/strategy_observation_evidence_bundle.schema.json`: StrategyObservationEvidenceBundle schema.
- `schemas/strategy_observation_case_file_summary.schema.json`: StrategyObservationCaseFileSummary schema.
- `schemas/strategy_observation_stack_closeout_checkpoint.schema.json`: StrategyObservationStackCloseoutCheckpoint schema.
- `fixtures/synthetic_strategy_definition.json`: deterministic metadata-only strategy definition fixture.
- `fixtures/synthetic_strategy_run_intent.json`: deterministic metadata-only replay attachment intent fixture.
- `fixtures/synthetic_strategy_run_trace.jsonl`: deterministic no-op strategy observation trace fixture.
- `fixtures/synthetic_strategy_noop_run_summary.json`: deterministic no-op strategy summary fixture.
- `fixtures/synthetic_strategy_run_manifest.json`: deterministic no-op strategy run artifact manifest fixture.
- `fixtures/synthetic_strategy_run_evidence_bundle.json`: deterministic no-op strategy run evidence bundle fixture.
- `fixtures/synthetic_strategy_dry_run_plan.json`: deterministic offline dry-run plan contract fixture.
- `fixtures/synthetic_strategy_dry_run_plan_evidence_summary.json`: deterministic StrategyDryRunPlan evidence summary fixture.
- `fixtures/synthetic_strategy_dry_run_readiness_checkpoint.json`: deterministic StrategyDryRunReadinessCheckpoint fixture.
- `fixtures/synthetic_strategy_dry_run_trace.jsonl`: deterministic no-op dry-run trace fixture.
- `fixtures/synthetic_strategy_dry_run_noop_summary.json`: deterministic no-op dry-run summary fixture.
- `fixtures/synthetic_strategy_dry_run_evidence_bundle.json`: deterministic no-op dry-run evidence bundle fixture.
- `fixtures/synthetic_strategy_dry_run_case_file_summary.json`: deterministic no-op dry-run case-file summary fixture.
- `fixtures/synthetic_strategy_dry_run_stack_closeout_checkpoint.json`: deterministic Phase 2 dry-run metadata stack closeout fixture.
- `fixtures/synthetic_strategy_observation_contract.json`: deterministic offline observation contract fixture.
- `fixtures/synthetic_strategy_observation_input_set.json`: deterministic offline observation input inventory fixture.
- `fixtures/synthetic_strategy_observation_trace.jsonl`: deterministic no-op observation trace fixture.
- `fixtures/synthetic_strategy_observation_noop_summary.json`: deterministic no-op observation summary fixture.
- `fixtures/synthetic_strategy_observation_evidence_bundle.json`: deterministic no-op observation evidence bundle fixture.
- `fixtures/synthetic_strategy_observation_case_file_summary.json`: deterministic no-op observation case-file summary fixture.
- `fixtures/synthetic_strategy_observation_stack_closeout_checkpoint.json`: deterministic Phase 3 observation metadata stack closeout fixture.
- `fixtures/negative/*.json`: deterministic negative fixtures for StrategyDefinition, StrategyRunIntent, and StrategyNoOpRunSummary validation hardening.
- `fixtures/negative/*.jsonl`: deterministic negative fixtures for StrategyRunTrace validation hardening.
- `src/strategy-definition-id.js`: deterministic StrategyDefinition id helper.
- `src/strategy-run-intent-id.js`: deterministic StrategyRunIntent id helper.
- `src/strategy-run-trace-id.js`: deterministic StrategyRunTrace id helper.
- `src/strategy-noop-run-summary-id.js`: deterministic StrategyNoOpRunSummary id helper.
- `src/strategy-run-manifest-id.js`: deterministic StrategyRunManifest id helper.
- `src/strategy-run-evidence-bundle-id.js`: deterministic StrategyRunEvidenceBundle id helper.
- `src/strategy-dry-run-plan-id.js`: deterministic StrategyDryRunPlan id helper.
- `src/strategy-dry-run-plan-evidence-summary-id.js`: deterministic StrategyDryRunPlanEvidenceSummary id helper.
- `src/strategy-dry-run-readiness-checkpoint-id.js`: deterministic StrategyDryRunReadinessCheckpoint id helper.
- `src/strategy-dry-run-trace-id.js`: deterministic StrategyDryRunTrace id helper.
- `src/strategy-dry-run-noop-summary-id.js`: deterministic StrategyDryRunNoOpSummary id helper.
- `src/strategy-dry-run-evidence-bundle-id.js`: deterministic StrategyDryRunEvidenceBundle id helper.
- `src/strategy-dry-run-case-file-summary-id.js`: deterministic StrategyDryRunCaseFileSummary id helper.
- `src/strategy-dry-run-stack-closeout-checkpoint-id.js`: deterministic StrategyDryRunStackCloseoutCheckpoint id helper.
- `src/strategy-observation-contract-id.js`: deterministic StrategyObservationContract id helper.
- `src/strategy-observation-input-set-id.js`: deterministic StrategyObservationInputSet id helper.
- `src/strategy-observation-trace-id.js`: deterministic StrategyObservationTrace id helper.
- `src/strategy-observation-noop-summary-id.js`: deterministic StrategyObservationNoOpSummary id helper.
- `src/strategy-observation-evidence-bundle-id.js`: deterministic StrategyObservationEvidenceBundle id helper.
- `src/strategy-observation-case-file-summary-id.js`: deterministic StrategyObservationCaseFileSummary id helper.
- `src/strategy-observation-stack-closeout-checkpoint-id.js`: deterministic StrategyObservationStackCloseoutCheckpoint id helper.
- `src/strategy-dry-run-artifacts.js`: local StrategyDryRun artifact contracts and readers.
- `src/strategy-observation-artifacts.js`: local StrategyObservation artifact contracts and readers.
- `src/run-noop-strategy.js`: local no-op strategy trace shell.
- `src/run-strategy-dry-run-noop.js`: local no-op strategy dry-run shell.
- `src/build-strategy-run-manifest.js`: local no-op strategy run manifest builder.
- `src/build-strategy-run-evidence-bundle.js`: local no-op strategy run evidence bundle builder.
- `src/build-strategy-dry-run-plan.js`: local StrategyDryRunPlan builder.
- `src/build-strategy-dry-run-plan-evidence-summary.js`: local StrategyDryRunPlanEvidenceSummary builder.
- `src/build-strategy-dry-run-readiness-checkpoint.js`: local StrategyDryRunReadinessCheckpoint builder.
- `src/build-strategy-dry-run-trace.js`: local StrategyDryRunTrace and StrategyDryRunNoOpSummary builder.
- `src/build-strategy-dry-run-evidence-bundle.js`: local StrategyDryRunEvidenceBundle builder.
- `src/build-strategy-dry-run-case-file-summary.js`: local StrategyDryRunCaseFileSummary builder.
- `src/build-strategy-dry-run-stack-closeout-checkpoint.js`: local StrategyDryRunStackCloseoutCheckpoint builder.
- `src/build-strategy-observation-contract.js`: local StrategyObservationContract builder.
- `src/build-strategy-observation-input-set.js`: local StrategyObservationInputSet builder.
- `src/build-strategy-observation-trace.js`: local StrategyObservationTrace and StrategyObservationNoOpSummary builder.
- `src/build-strategy-observation-evidence-bundle.js`: local StrategyObservationEvidenceBundle builder.
- `src/build-strategy-observation-case-file-summary.js`: local StrategyObservationCaseFileSummary builder.
- `src/build-strategy-observation-stack-closeout-checkpoint.js`: local StrategyObservationStackCloseoutCheckpoint builder.
- `src/validate-strategy-definition.js`: local StrategyDefinition validator.
- `src/validate-strategy-run-intent.js`: local StrategyRunIntent validator.
- `src/validate-strategy-run-trace.js`: local StrategyRunTrace validator.
- `src/validate-strategy-noop-run-summary.js`: local StrategyNoOpRunSummary validator.
- `src/validate-strategy-run-manifest.js`: local StrategyRunManifest validator.
- `src/validate-strategy-run-evidence-bundle.js`: local StrategyRunEvidenceBundle validator.
- `src/validate-strategy-dry-run-plan.js`: local StrategyDryRunPlan validator.
- `src/validate-strategy-dry-run-plan-evidence-summary.js`: local StrategyDryRunPlanEvidenceSummary validator.
- `src/validate-strategy-dry-run-readiness-checkpoint.js`: local StrategyDryRunReadinessCheckpoint validator.
- `src/validate-strategy-dry-run-trace.js`: local StrategyDryRunTrace validator.
- `src/validate-strategy-dry-run-noop-summary.js`: local StrategyDryRunNoOpSummary validator.
- `src/validate-strategy-dry-run-evidence-bundle.js`: local StrategyDryRunEvidenceBundle validator.
- `src/validate-strategy-dry-run-case-file-summary.js`: local StrategyDryRunCaseFileSummary validator.
- `src/validate-strategy-dry-run-stack-closeout-checkpoint.js`: local StrategyDryRunStackCloseoutCheckpoint validator.
- `src/validate-strategy-observation-contract.js`: local StrategyObservationContract validator.
- `src/validate-strategy-observation-input-set.js`: local StrategyObservationInputSet validator.
- `src/validate-strategy-observation-trace.js`: local StrategyObservationTrace validator.
- `src/validate-strategy-observation-noop-summary.js`: local StrategyObservationNoOpSummary validator.
- `src/validate-strategy-observation-evidence-bundle.js`: local StrategyObservationEvidenceBundle validator.
- `src/validate-strategy-observation-case-file-summary.js`: local StrategyObservationCaseFileSummary validator.
- `src/validate-strategy-observation-stack-closeout-checkpoint.js`: local StrategyObservationStackCloseoutCheckpoint validator.

## Commands

```powershell
npm run validate:strategy-definition
npm run validate:strategy-run-intent
npm run validate:strategy-run-trace
npm run validate:strategy-noop-run-summary
npm run validate:strategy-run-manifest
npm run validate:strategy-run-evidence-bundle
npm run validate:strategy-dry-run-plan
npm run validate:strategy-dry-run-plan-evidence-summary
npm run validate:strategy-dry-run-readiness-checkpoint
npm run validate:strategy-dry-run-trace
npm run validate:strategy-dry-run-noop-summary
npm run validate:strategy-dry-run-evidence-bundle
npm run validate:strategy-dry-run-case-file-summary
npm run validate:strategy-dry-run-stack-closeout-checkpoint
npm run validate:strategy-observation-contract
npm run validate:strategy-observation-input-set
npm run validate:strategy-observation-trace
npm run validate:strategy-observation-noop-summary
npm run validate:strategy-observation-evidence-bundle
npm run validate:strategy-observation-case-file-summary
npm run validate:strategy-observation-stack-closeout-checkpoint
npm run test:strategy-dsl
```

## Boundary

StrategyDefinition is declarative contract metadata only. It may define allowed input artifact categories, blocked output categories, and inert parameter values.

StrategyRunIntent is replay attachment metadata only. It may reference a StrategyDefinition and existing replay evidence/manifest ids.

No strategy executable, handler, callback, network endpoint, order request, trade request, signal request, decision request, recommendation, bankroll allocation, credential, token, polling, WebSocket, or live execution field is allowed.

Negative fixtures must fail deterministically and exist only to prove the validators reject unsafe or invalid metadata before any future strategy execution shell can consume it.

StrategyRunTrace is no-op observation metadata only. It may point to replay inputs that a future strategy would observe, but it must not include executable strategy runtime, signal requests, decision requests, order/trade requests, recommendations, analytics, bankroll allocation, credentials, polling, WebSockets, or live execution fields.

StrategyRunTrace and StrategyNoOpRunSummary negative fixtures must fail deterministically before any future strategy execution layer can consume them.

StrategyRunManifest and StrategyRunEvidenceBundle are inventory/proof metadata only. They may reference local Strategy DSL fixtures and validation commands, but they must not include executable strategy runtime, signal requests, decision requests, order/trade requests, recommendations, analytics, bankroll allocation, credentials, polling, WebSockets, or live execution fields.

StrategyRunManifest and StrategyRunEvidenceBundle negative fixtures must fail deterministically before any future strategy execution layer can consume them.

StrategyDryRunPlan is dry-run planning metadata only. It may list read-only input artifacts, forbidden outputs, metadata-only observation steps, and safety constraints. It must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, or place orders.

StrategyDryRunPlan negative fixtures must fail deterministically before any future strategy execution layer can consume dry-run planning metadata.

StrategyDryRunPlanEvidenceSummary is validation/inventory metadata only. It may count and reference a validated dry-run plan, but it must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, or place orders.

StrategyDryRunPlanEvidenceSummary negative fixtures must fail deterministically before any future strategy execution or analytics layer can consume dry-run plan summary metadata.

StrategyDryRunReadinessCheckpoint is readiness metadata only. It may inventory validated prerequisite artifacts and readiness checks, but it must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, or place orders.

StrategyDryRunReadinessCheckpoint negative fixtures must fail deterministically before any future strategy dry-run shell can consume readiness metadata.

StrategyDryRunTrace and StrategyDryRunNoOpSummary are no-op dry-run metadata only. They may record that a validated dry-run plan's metadata-only observation steps were walked, but they must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, or place orders.

StrategyDryRunTrace and StrategyDryRunNoOpSummary negative fixtures must fail deterministically before any future strategy execution layer can consume dry-run trace metadata.

StrategyDryRunEvidenceBundle and StrategyDryRunCaseFileSummary are dry-run evidence and case-file metadata only. They may inventory validated local no-op dry-run artifacts and consistency totals, but they must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, or place orders.

StrategyDryRunEvidenceBundle and StrategyDryRunCaseFileSummary negative fixtures must fail deterministically before any future strategy execution or analytics layer can consume dry-run evidence metadata.

StrategyDryRunStackCloseoutCheckpoint is closeout/readiness metadata only. Its `freeze_recommendation` applies only to freezing the offline metadata stack and must not be interpreted as a trading, deployment, recommendation, analytics, or bankroll signal.

StrategyDryRunStackCloseoutCheckpoint negative fixtures must fail deterministically before the Phase 2 dry-run metadata stack is frozen.

StrategyObservationContract and StrategyObservationInputSet are Phase 3 offline observation metadata only. They may identify immutable read-only inputs from the frozen Phase 2 dry-run stack and state metadata-only observation rules, but they must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, place orders, or produce analytics.

StrategyObservationContract and StrategyObservationInputSet negative fixtures must fail deterministically before any future observation pass can consume observation metadata.

StrategyObservationTrace and StrategyObservationNoOpSummary are no-op observation metadata only. They may record that approved read-only observation inputs were seen, but they must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, place orders, or produce analytics.

StrategyObservationTrace and StrategyObservationNoOpSummary negative fixtures must fail deterministically before any future observation processing layer can consume observation trace metadata.

StrategyObservationEvidenceBundle and StrategyObservationCaseFileSummary are observation evidence and case-file metadata only. They may inventory validated local no-op observation artifacts and consistency totals, but they must not execute strategy logic, calculate edge, generate signals, generate decisions, create paper entries/exits, recommend trades, allocate bankroll, connect to external systems, place orders, or produce analytics.

StrategyObservationEvidenceBundle and StrategyObservationCaseFileSummary negative fixtures must fail deterministically before any future observation processing layer can consume observation evidence metadata.

StrategyObservationStackCloseoutCheckpoint is closeout/readiness metadata only. Its `freeze_recommendation` applies only to freezing the offline observation metadata stack and must not be interpreted as a trading, deployment, recommendation, analytics, or bankroll signal.
