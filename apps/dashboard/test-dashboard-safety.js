// Static safety scan for apps/dashboard/index.html
// Verifies no live/execution/network code patterns exist in the dashboard source.
// Run: node apps/dashboard/test-dashboard-safety.js

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import assert from 'assert';

const __dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dir, 'index.html'), 'utf8');

// Code patterns that must not appear (not display text — actual JS/HTML behavior patterns)
const FORBIDDEN_CODE_PATTERNS = [
  { pattern: /fetch\s*\(/, label: 'fetch() call' },
  { pattern: /new\s+XMLHttpRequest/, label: 'XMLHttpRequest' },
  { pattern: /new\s+WebSocket/, label: 'WebSocket constructor' },
  { pattern: /import\s+\{.*\}\s+from\s+['"][^.][^'"]*['"]/, label: 'external ES module import' },
  { pattern: /require\s*\(\s*['"][^.][^'"]*['"]\s*\)/, label: 'external require()' },
  { pattern: /<script\s+src=["']https?:\/\//, label: 'external script src' },
  { pattern: /<link\s[^>]*href=["']https?:\/\//, label: 'external stylesheet link' },
  { pattern: /KALSHI_API|KALSHI_TOKEN|API_KEY|API_SECRET/, label: 'credential env var pattern' },
  { pattern: /process\.env\.[A-Z_]{4,}/, label: 'process.env credential access' },
  { pattern: /<form\b[^>]*action=["'][^"']*["'][^>]*>/, label: '<form> with action' },
  { pattern: /<input[^>]+type=["']submit["']/, label: 'submit input' },
  { pattern: /setInterval\s*\(|setTimeout\s*\(.*fetch/, label: 'polling via setInterval/setTimeout+fetch' },
  { pattern: /navigator\.sendBeacon/, label: 'sendBeacon' },
  { pattern: /EventSource\s*\(/, label: 'SSE EventSource' },
];

// Safety flags that must appear with the correct value
const REQUIRED_FLAGS = [
  { pattern: /live_execution_allowed.*?false/s, label: 'live_execution_allowed: false displayed' },
  { pattern: /order_placement_allowed.*?false/s, label: 'order_placement_allowed: false displayed' },
  { pattern: /credentials_allowed.*?false/s, label: 'credentials_allowed: false displayed' },
  { pattern: /network_allowed.*?false/s, label: 'network_allowed: false displayed' },
  { pattern: /paper_only.*?true/s, label: 'paper_only: true displayed' },
  { pattern: /VALIDATION_PASSED/, label: 'VALIDATION_PASSED reason code displayed' },
  { pattern: /offline_fixture_replay/, label: 'offline_fixture_replay mode displayed' },
  // Phase 4I — processing pipeline panel markers
  { pattern: /processing_noop_summary_ready/, label: 'processing_noop_summary_ready status displayed (Phase 4G)' },
  { pattern: /noop_processing_completed/, label: 'noop_processing_completed lifecycle event displayed (Phase 4F)' },
  { pattern: /strategy_observation_processing_trace/, label: 'processing trace artifact type displayed (Phase 4F)' },
  { pattern: /strategy_observation_processing_noop_summary/, label: 'processing noop summary artifact type displayed (Phase 4G)' },
  { pattern: /sopns_eb0a5457434b46ab04693890fa87ba42/, label: 'processing noop summary ID displayed (Phase 4G)' },
  { pattern: /sopam_f925d406b96cad22874fe8dbf9f1541a/, label: 'updated artifact manifest ID displayed (Phase 4H)' },
  { pattern: /sha256:46ebe409/, label: 'processing trace SHA-256 hash displayed (Phase 4H)' },
  { pattern: /sha256:bcfb57e7/, label: 'processing noop summary SHA-256 hash displayed (Phase 4H)' },
  { pattern: /actionable_outputs.*?0|actionable.*?output.*?0/s, label: 'actionable output count: 0 displayed' },
  // Phase 4J — evidence chain viewer markers
  { pattern: /id="evidence-chain"/, label: 'evidence-chain panel id present (Phase 4J)' },
  { pattern: /id="safety-guarantee-block"/, label: 'safety-guarantee-block panel id present (Phase 4J)' },
  { pattern: /sopc_d5f85d3ac42b6ade0754837ea0354a77/, label: 'processing contract ID displayed in evidence chain (Phase 4J)' },
  { pattern: /sopis_e375ea353c05147738b963a553f0e776/, label: 'processing input set ID displayed in evidence chain (Phase 4J)' },
  { pattern: /Processing Contract/, label: 'Processing Contract step label displayed (Phase 4J)' },
  { pattern: /Processing Input Set/, label: 'Processing Input Set step label displayed (Phase 4J)' },
  { pattern: /Processing Trace/, label: 'Processing Trace step label displayed (Phase 4J)' },
  { pattern: /Processing Noop Summary/, label: 'Processing Noop Summary step label displayed (Phase 4J)' },
  { pattern: /Artifact Manifest/, label: 'Artifact Manifest step label displayed (Phase 4J)' },
];

let passed = 0;
let failed = 0;

console.log('\nOVERLORD :: Dashboard Safety Scan\n' + '═'.repeat(44));

console.log('\n[1] Forbidden code patterns (must be absent)');
for (const { pattern, label } of FORBIDDEN_CODE_PATTERNS) {
  if (pattern.test(src)) {
    console.log(`  FAIL  ${label}`);
    failed++;
  } else {
    console.log(`  pass  ${label}`);
    passed++;
  }
}

console.log('\n[2] Required safety display (must be present)');
for (const { pattern, label } of REQUIRED_FLAGS) {
  if (pattern.test(src)) {
    console.log(`  pass  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}`);
    failed++;
  }
}

console.log('\n' + '─'.repeat(44));
console.log(`Result: ${passed} passed, ${failed} failed\n`);

assert.strictEqual(failed, 0, `Dashboard safety scan failed with ${failed} violation(s).`);
console.log('Dashboard source is clean. No live/execution/network code detected.\n');
