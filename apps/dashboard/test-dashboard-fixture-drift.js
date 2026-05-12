// Dashboard evidence fixture drift guard for apps/dashboard/index.html
// Reads the 5 evidence chain fixture files, extracts canonical IDs/values,
// and asserts they appear verbatim in the dashboard HTML.
// Also live-computes SHA-256 of output artifacts and cross-checks against
// the artifact manifest and the dashboard display.
// Run: node apps/dashboard/test-dashboard-fixture-drift.js

import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import assert from 'assert';

const __dir = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dir, '..', '..');
const fixtureDir = join(repoRoot, 'packages', 'strategy-dsl', 'fixtures');
const src = readFileSync(join(__dir, 'index.html'), 'utf8');

function sha256File(filePath) {
  return 'sha256:' + createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

// Load fixtures
const contract = JSON.parse(readFileSync(join(fixtureDir, 'synthetic_strategy_observation_processing_contract.json'), 'utf8'));
const inputSet = JSON.parse(readFileSync(join(fixtureDir, 'synthetic_strategy_observation_processing_input_set.json'), 'utf8'));
const noopSummary = JSON.parse(readFileSync(join(fixtureDir, 'synthetic_strategy_observation_processing_noop_summary.json'), 'utf8'));
const manifest = JSON.parse(readFileSync(join(fixtureDir, 'synthetic_strategy_observation_processing_artifact_manifest.json'), 'utf8'));
const traceRaw = readFileSync(join(fixtureDir, 'synthetic_strategy_observation_processing_trace.jsonl'), 'utf8');
const traceRecords = traceRaw.trim().split('\n').map(l => JSON.parse(l));

// Live-compute SHA-256 of the two output artifacts
const liveTraceHash = sha256File(join(fixtureDir, 'synthetic_strategy_observation_processing_trace.jsonl'));
const liveNoopHash = sha256File(join(fixtureDir, 'synthetic_strategy_observation_processing_noop_summary.json'));

// Manifest-recorded hashes
const manifestTraceHash = manifest.output_artifact_hashes.find(h => h.artifact_type === 'strategy_observation_processing_trace')?.sha256;
const manifestNoopHash = manifest.output_artifact_hashes.find(h => h.artifact_type === 'strategy_observation_processing_noop_summary')?.sha256;

let passed = 0;
let failed = 0;

console.log('\nOVERLORD :: Dashboard Fixture Drift Guard\n' + '═'.repeat(44));

function check(label, condition) {
  if (condition) {
    console.log(`  pass  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('\n[1] Processing Contract');
check('contract ID in dashboard', src.includes(contract.strategy_observation_processing_contract_id));
check('contract reason_code in dashboard', src.includes(contract.reason_code));

console.log('\n[2] Processing Input Set');
check('input set ID in dashboard', src.includes(inputSet.strategy_observation_processing_input_set_id));
check('input artifact count (7) in dashboard', src.includes(String(inputSet.input_artifacts.length)));

console.log('\n[3] Processing Trace');
check('trace record count (9) in dashboard', src.includes(String(traceRecords.length)));
check('trace started event in dashboard', src.includes(traceRecords[0].trace_event_type));
check('trace completed event in dashboard', src.includes(traceRecords[traceRecords.length - 1].trace_event_type));

console.log('\n[4] Processing Noop Summary');
check('noop summary ID in dashboard', src.includes(noopSummary.strategy_observation_processing_noop_summary_id));
check('noop summary status in dashboard', src.includes(noopSummary.status));
check('noop total_trace_records in dashboard', src.includes(String(noopSummary.total_trace_records)));
check('noop total_inputs_observed in dashboard', src.includes(String(noopSummary.total_inputs_observed)));

console.log('\n[5] Artifact Manifest');
check('manifest ID in dashboard', src.includes(manifest.artifact_manifest_id));
check('manifest reason_code in dashboard', src.includes(manifest.reason_code));
check('manifest input artifact count (7) in dashboard', src.includes(String(manifest.input_artifacts.length)));
check('manifest output artifact count (2) in dashboard', src.includes(String(manifest.processing_output_artifacts.length)));

console.log('\n[6] Live SHA-256 integrity');
check('trace hash: live file matches manifest record', liveTraceHash === manifestTraceHash);
check('noop summary hash: live file matches manifest record', liveNoopHash === manifestNoopHash);
check('trace hash prefix in dashboard', src.includes(liveTraceHash.slice(0, 16)));
check('noop summary hash prefix in dashboard', src.includes(liveNoopHash.slice(0, 16)));

console.log('\n' + '─'.repeat(44));
console.log(`Result: ${passed} passed, ${failed} failed\n`);

assert.strictEqual(failed, 0, `Dashboard fixture drift guard failed with ${failed} violation(s).`);
console.log('Dashboard evidence values match live fixture files. No drift detected.\n');
