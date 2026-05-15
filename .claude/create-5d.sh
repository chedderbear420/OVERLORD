#!/usr/bin/env bash
export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$HOME/.local/bin:$HOME/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
set -e
cd ~/Projects/Overlord

echo "=== Current branch ==="
git branch --show-current

echo "=== Create Phase 5D schema ==="
cat > packages/strategy-dsl/schemas/kalshi_gate_evaluation_summary.schema.json << 'SCHEMA_EOF'
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "kalshi_gate_evaluation_summary.schema.json",
  "title": "KalshiGateEvaluationSummary",
  "description": "Phase 5D — Gate evaluation summary. Gates are evaluated but all blocked. No gates pass. All advanced/live permissions remain blocked.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "kalshi_gate_evaluation_summary_id",
    "schema_version",
    "generated_at",
    "phase",
    "evaluation_status",
    "upstream_evidence_bundle_id",
    "upstream_bundle_schema_version",
    "gates_evaluated",
    "gates_passed_count",
    "gates_failed_count",
    "gates_blocked_count",
    "gate_results",
    "overall_gate_decision",
    "safety_flags",
    "forbidden_capabilities",
    "allowed_outputs",
    "forbidden_outputs",
    "reason_code",
    "reason"
  ],
  "properties": {
    "kalshi_gate_evaluation_summary_id": {
      "type": "string",
      "pattern": "^kges_[a-f0-9]{32}$"
    },
    "schema_version": {
      "const": "kalshi_gate_evaluation_summary.v1"
    },
    "generated_at": {
      "type": "string",
      "format": "date-time"
    },
    "phase": {
      "const": "Phase 5D"
    },
    "evaluation_status": {
      "enum": ["evaluated_blocked", "evaluated_incomplete", "evaluation_failed"]
    },
    "upstream_evidence_bundle_id": {
      "type": "string",
      "pattern": "^kprgeb_[a-f0-9]{32}$"
    },
    "upstream_bundle_schema_version": {
      "const": "kalshi_paper_readiness_gate_evidence_bundle.v1"
    },
    "gates_evaluated": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "gates_passed_count": {
      "type": "integer",
      "const": 0
    },
    "gates_failed_count": {
      "type": "integer",
      "minimum": 1
    },
    "gates_blocked_count": {
      "type": "integer",
      "minimum": 0
    },
    "gate_results": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["gate_id", "gate_name", "evaluation_result", "pass", "blocking_reason"],
        "properties": {
          "gate_id": { "type": "string" },
          "gate_name": { "type": "string" },
          "evaluation_result": {
            "enum": ["failed", "blocked", "insufficient_evidence"]
          },
          "pass": { "const": false },
          "blocking_reason": { "type": "string" }
        }
      }
    },
    "overall_gate_decision": {
      "enum": ["all_gates_blocked", "all_gates_failed", "gates_not_passed"]
    },
    "safety_flags": {
      "type": "object",
      "additionalProperties": false,
      "required": [
        "paper_only",
        "gate_evaluation_allowed",
        "gates_passed",
        "phase_6_ready",
        "live_mode_allowed",
        "live_execution_allowed",
        "order_placement_allowed",
        "credentials_allowed",
        "credential_access_allowed",
        "autonomous_execution_allowed",
        "operator_signoff_complete"
      ],
      "properties": {
        "paper_only": { "const": true },
        "gate_evaluation_allowed": { "const": true },
        "gates_passed": { "const": false },
        "phase_6_ready": { "const": false },
        "live_mode_allowed": { "const": false },
        "live_execution_allowed": { "const": false },
        "order_placement_allowed": { "const": false },
        "credentials_allowed": { "const": false },
        "credential_access_allowed": { "const": false },
        "autonomous_execution_allowed": { "const": false },
        "operator_signoff_complete": { "const": false }
      }
    },
    "forbidden_capabilities": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "allowed_outputs": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "forbidden_outputs": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "reason_code": {
      "const": "GATES_EVALUATED_ALL_BLOCKED"
    },
    "reason": {
      "type": "string",
      "minLength": 1
    }
  }
}
SCHEMA_EOF

echo "Schema created"
echo "Continuing with ID helper and builder..."
