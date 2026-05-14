import {kalshiOperatorSignoffContractId} from "./kalshi-operator-signoff-contract-id.js";
const SCHEMA_VERSION="kalshi_operator_signoff_contract.v1";
const PHASE="Phase 5E";
const SIGNOFF_STATUS="not_complete";
const OPERATOR_SIGNOFF_COMPLETE=false;
const MANUAL_REVIEW_REQUIRED=true;
const OPERATOR_REVIEW_REQUIRED=true;
const REASON_CODE="OPERATOR_SIGNOFF_NOT_COMPLETE";
const REASON="operator signoff not complete; manual review required; paper mode remains blocked";
export const defaultContractOptions={generatedAt:"2026-05-14T00:00:00Z"};
export function buildKalshiOperatorSignoffContract(gateSummary,options={}){
  const opts={...defaultContractOptions,...options};
  const id=kalshiOperatorSignoffContractId({phase:PHASE,signoffStatus:SIGNOFF_STATUS,operatorSignoffComplete:OPERATOR_SIGNOFF_COMPLETE});
  return {
    kalshi_operator_signoff_contract_id:id,
    schema_version:SCHEMA_VERSION,
    generated_at:opts.generatedAt,
    phase:PHASE,
    signoff_status:SIGNOFF_STATUS,
    upstream_gate_evaluation_summary_id:gateSummary.kalshi_gate_evaluation_summary_id,
    upstream_summary_schema_version:"kalshi_gate_evaluation_summary.v1",
    operator_signoff_complete:OPERATOR_SIGNOFF_COMPLETE,
    manual_review_required:MANUAL_REVIEW_REQUIRED,
    operator_review_required:OPERATOR_REVIEW_REQUIRED,
    safety_flags:{paper_only:true,phase_6_ready:false,live_mode_allowed:false,order_placement_allowed:false,credentials_allowed:false,autonomous_execution_allowed:false,operator_signoff_complete:false},
    forbidden_capabilities:["live_trading","order_placement","credentials","api_keys","autonomous_execution","approval_token","signature_secret","phase_6_unlock"],
    allowed_outputs:["signoff_status_report","review_request_metadata"],
    forbidden_outputs:["approval_token","signature","credentials","live_orders","phase_6_approval"],
    reason_code:REASON_CODE,
    reason:REASON
  };
}
