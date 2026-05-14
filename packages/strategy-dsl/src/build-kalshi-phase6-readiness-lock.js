import {kalshiPhase6ReadinessLockId} from "./kalshi-phase6-readiness-lock-id.js";
const SCHEMA_VERSION="kalshi_phase6_readiness_lock.v1";
const PHASE="Phase 5F";
const LOCK_STATUS="locked";
const PHASE6_READY=false;
const REASON_CODE="PHASE_6_LOCKED";
const REASON="phase 6 locked; all gates blocked; operator signoff not complete; paper mode remains blocked";
export const defaultLockOptions={generatedAt:"2026-05-14T00:00:00Z"};
export function buildKalshiPhase6ReadinessLock(signoffContract,options={}){
  const opts={...defaultLockOptions,...options};
  const id=kalshiPhase6ReadinessLockId({phase:PHASE,lockStatus:LOCK_STATUS,phase6Ready:PHASE6_READY});
  return {
    kalshi_phase6_readiness_lock_id:id,
    schema_version:SCHEMA_VERSION,
    generated_at:opts.generatedAt,
    phase:PHASE,
    readiness_lock_status:LOCK_STATUS,
    upstream_operator_signoff_id:signoffContract.kalshi_operator_signoff_contract_id,
    upstream_signoff_schema_version:"kalshi_operator_signoff_contract.v1",
    unlock_requirements:["all_gates_passed","operator_signoff_complete","risk_governor_implemented","manual_approval_obtained"],
    safety_flags:{paper_only:true,phase_6_ready:false,live_mode_allowed:false,order_placement_allowed:false,credentials_allowed:false,autonomous_execution_allowed:false,gates_passed:false,operator_signoff_complete:false},
    forbidden_capabilities:["live_trading","order_placement","credentials","api_keys","autonomous_execution","phase_6_unlock","live_mode_enablement"],
    allowed_outputs:["lock_status_report","unlock_requirement_checklist"],
    forbidden_outputs:["phase_6_approval","live_orders","credentials","unlock_token"],
    reason_code:REASON_CODE,
    reason:REASON
  };
}
